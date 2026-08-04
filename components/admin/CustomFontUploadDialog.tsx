"use client";

import axios from "axios";
import { FileType2, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invalidateCustomFontManifest } from "@/hooks/useDynamicFont";
import type {
  AdminCustomFontFamily,
  CustomFontAnalysis,
  CustomFontStyle,
  FontCategory,
} from "@/lib/custom-fonts/types";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".woff2,.woff,.ttf,.otf";

interface UploadForm {
  name: string;
  category: FontCategory;
  weight: number;
  style: CustomFontStyle;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; file: File; progress: number }
  | { status: "analyzing"; file: File; pendingKey: string }
  | {
      status: "editing";
      file: File;
      pendingKey: string;
      analysis: CustomFontAnalysis;
    }
  | {
      status: "saving";
      file: File;
      pendingKey: string;
      analysis: CustomFontAnalysis;
    };

interface CustomFontUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family?: AdminCustomFontFamily;
  onSaved: (family: AdminCustomFontFamily) => void;
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

export default function CustomFontUploadDialog({
  open,
  onOpenChange,
  family,
  onSaved,
}: CustomFontUploadDialogProps) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [form, setForm] = useState<UploadForm>({
    name: family?.family ?? "",
    category: family?.category ?? "display",
    weight: 400,
    style: "normal",
  });
  const [error, setError] = useState<string | null>(null);
  const [replacementRequired, setReplacementRequired] = useState(false);
  const pendingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: family?.family ?? "",
      category: family?.category ?? "display",
      weight: 400,
      style: "normal",
    });
    setState({ status: "idle" });
    setError(null);
    setReplacementRequired(false);
    pendingKeyRef.current = null;
  }, [family, open]);

  async function cleanPending() {
    const pendingKey = pendingKeyRef.current;
    pendingKeyRef.current = null;
    if (!pendingKey) return;
    await fetch("/api/admin/custom-fonts/analyze", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingKey }),
    }).catch(() => undefined);
  }

  function changeOpen(next: boolean) {
    if (!next) void cleanPending();
    onOpenChange(next);
  }

  async function upload(file: File) {
    setError(null);
    setReplacementRequired(false);
    if (file.size > MAX_BYTES) {
      setError("O ficheiro excede o limite de 10 MB.");
      return;
    }
    try {
      await cleanPending();
      setState({ status: "uploading", file, progress: 0 });
      const presignResponse = await fetch("/api/admin/custom-fonts/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const presign = await responseJson(presignResponse);
      if (!presignResponse.ok) {
        throw new Error(String(presign.error ?? "Não foi possível preparar o upload."));
      }
      const pendingKey = String(presign.pendingKey);
      pendingKeyRef.current = pendingKey;
      await axios.put(String(presign.presignedUrl), file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        onUploadProgress(event) {
          if (!event.total) return;
          setState({
            status: "uploading",
            file,
            progress: Math.round((event.loaded / event.total) * 100),
          });
        },
      });
      setState({ status: "analyzing", file, pendingKey });
      const analysisResponse = await fetch("/api/admin/custom-fonts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingKey }),
      });
      const analysisBody = await responseJson(analysisResponse);
      if (!analysisResponse.ok) {
        throw new Error(String(analysisBody.error ?? "A fonte não pôde ser validada."));
      }
      const analysis = analysisBody as unknown as CustomFontAnalysis;
      setForm({
        name: family?.family ?? analysis.familyName,
        category: family?.category ?? "display",
        weight: analysis.weight,
        style: analysis.style,
      });
      setState({ status: "editing", file, pendingKey, analysis });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "O upload da fonte falhou.",
      );
      setState({ status: "idle" });
    }
  }

  async function save(replace: boolean) {
    if (state.status !== "editing") return;
    setError(null);
    setState({ ...state, status: "saving" });
    const url = family
      ? `/api/admin/custom-fonts/${family.id}/variants`
      : "/api/admin/custom-fonts";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(family
            ? {}
            : { name: form.name, fallbackCategory: form.category }),
          pendingKey: state.pendingKey,
          originalFileName: state.file.name,
          expectedChecksum: state.analysis.checksum,
          weight: form.weight,
          style: form.style,
          replace,
        }),
      });
      const body = await responseJson(response);
      if (response.status === 409 && body.code === "replacement_required") {
        setReplacementRequired(true);
        setState({ ...state, status: "editing" });
        return;
      }
      if (!response.ok) {
        throw new Error(String(body.error ?? "Não foi possível guardar a fonte."));
      }
      const saved = body as unknown as AdminCustomFontFamily;
      pendingKeyRef.current = null;
      invalidateCustomFontManifest(saved.id);
      onSaved(saved);
      toast.success(family ? "Variante guardada" : "Fonte adicionada");
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível guardar a fonte.",
      );
      setState({ ...state, status: "editing" });
    }
  }

  const busy =
    state.status === "uploading" ||
    state.status === "analyzing" ||
    state.status === "saving";
  const ready = state.status === "editing";

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        data-font-upload-dialog
        overlayClassName="z-[10000]"
        className="z-[10001] sm:max-w-xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileType2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-balance">
                {family ? `Adicionar variante a ${family.family}` : "Adicionar fonte"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-pretty">
                WOFF2, WOFF, TTF ou OTF. Máximo de 10 MB por variante.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl bg-muted/45 px-6 py-5 text-center ring-1 ring-foreground/10 transition-[background-color,box-shadow,transform] hover:bg-muted/70 hover:shadow-sm active:scale-[0.96] focus-within:ring-2 focus-within:ring-ring">
            {busy ? (
              <Loader2 className="mb-2 size-6 animate-spin text-primary" />
            ) : (
              <UploadCloud className="mb-2 size-6 text-primary" />
            )}
            <span className="font-medium">
              {state.status === "uploading"
                ? `A enviar… ${state.progress}%`
                : state.status === "analyzing"
                  ? "A validar a fonte…"
                  : state.status === "editing" || state.status === "saving"
                    ? state.file.name
                    : "Escolher ficheiro de fonte"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              Os dados incorporados serão lidos automaticamente.
            </span>
            <input
              type="file"
              accept={ACCEPT}
              disabled={busy}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>

          {ready && (
            <div className="grid gap-4 rounded-xl bg-background p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
              {!family && (
                <>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="custom-font-name">Nome da família</Label>
                    <Input
                      id="custom-font-name"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="custom-font-category">Categoria</Label>
                    <select
                      id="custom-font-category"
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value as FontCategory,
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="serif">Serif</option>
                      <option value="sans-serif">Sans-serif</option>
                      <option value="display">Display</option>
                      <option value="handwriting">Manuscrita</option>
                      <option value="monospace">Monoespaçada</option>
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="custom-font-weight">Peso</Label>
                <Input
                  id="custom-font-weight"
                  type="number"
                  min={100}
                  max={900}
                  step={100}
                  value={form.weight}
                  className="tabular-nums"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      weight: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-font-style">Estilo</Label>
                <select
                  id="custom-font-style"
                  value={form.style}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      style: event.target.value as CustomFontStyle,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Itálico</option>
                </select>
              </div>
            </div>
          )}

          {replacementRequired && (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200">
              Esta família já tem uma variante {form.weight} {form.style}.
              Substituí-la atualiza todos os convites que usam esta fonte.
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => changeOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!ready || (!family && !form.name.trim())}
            onClick={() => void save(replacementRequired)}
            className="active:scale-[0.96] transition-transform"
          >
            {state.status === "saving" && <Loader2 className="animate-spin" />}
            {replacementRequired ? "Substituir variante" : "Guardar fonte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
