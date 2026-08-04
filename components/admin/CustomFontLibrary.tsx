"use client";

import {
  Archive,
  FileType2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import CustomFontUploadDialog from "@/components/admin/CustomFontUploadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invalidateCustomFontManifest, useDynamicFont } from "@/hooks/useDynamicFont";
import {
  filterCustomFontFamilies,
  summarizeCustomFontLibrary,
  type CustomFontArchiveFilter,
} from "@/lib/custom-fonts/domain";
import type {
  AdminCustomFontFamily,
  FontCategory,
} from "@/lib/custom-fonts/types";
import type { CustomFontUsage } from "@/lib/custom-fonts/usage";

const CATEGORY_LABELS: Record<FontCategory, string> = {
  serif: "Serif",
  "sans-serif": "Sans-serif",
  display: "Display",
  handwriting: "Manuscrita",
  monospace: "Mono",
};

const USAGE_LABELS: Record<CustomFontUsage["kind"], string> = {
  theme: "modelo de convite",
  invitation: "convite",
  "save-the-date-theme": "modelo Save the Date",
  "save-the-date": "Save the Date",
};

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function FontSpecimen({ family }: { family: AdminCustomFontFamily }) {
  useDynamicFont(family.value);
  return (
    <div
      className="truncate text-[clamp(1.55rem,3vw,2.25rem)] leading-tight tracking-tight"
      style={{ fontFamily: family.value }}
    >
      Sofia & Miguel
    </div>
  );
}

export default function CustomFontLibrary() {
  const [families, setFamilies] = useState<AdminCustomFontFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] =
    useState<CustomFontArchiveFilter>("active");
  const [uploadFamily, setUploadFamily] = useState<AdminCustomFontFamily>();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCustomFontFamily>();
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<FontCategory>("display");
  const [deleting, setDeleting] = useState<AdminCustomFontFamily>();
  const [deleteUsages, setDeleteUsages] = useState<CustomFontUsage[]>([]);
  const [workingId, setWorkingId] = useState<string>();

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/custom-fonts?archived=all&limit=100");
      if (!response.ok) throw new Error("Não foi possível carregar a biblioteca.");
      const body = (await response.json()) as { families: AdminCustomFontFamily[] };
      setFamilies(body.families);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar fontes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => filterCustomFontFamilies(families, { search, archived: archiveFilter }),
    [archiveFilter, families, search],
  );
  const summary = useMemo(() => summarizeCustomFontLibrary(families), [families]);

  function upsert(saved: AdminCustomFontFamily) {
    setFamilies((current) =>
      [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) =>
        a.family.localeCompare(b.family),
      ),
    );
  }

  async function patchFamily(
    family: AdminCustomFontFamily,
    changes: Record<string, unknown>,
  ) {
    setWorkingId(family.id);
    try {
      const response = await fetch(`/api/admin/custom-fonts/${family.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(String(body.error ?? "Não foi possível guardar."));
      const saved = body as unknown as AdminCustomFontFamily;
      invalidateCustomFontManifest(saved.id);
      upsert(saved);
      return saved;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível guardar.");
    } finally {
      setWorkingId(undefined);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setWorkingId(deleting.id);
    try {
      const response = await fetch(`/api/admin/custom-fonts/${deleting.id}`, {
        method: "DELETE",
      });
      if (response.status === 409) {
        const body = await readJson(response);
        setDeleteUsages((body.usages ?? []) as CustomFontUsage[]);
        return;
      }
      if (!response.ok) {
        const body = await readJson(response);
        throw new Error(String(body.error ?? "Não foi possível apagar a fonte."));
      }
      invalidateCustomFontManifest(deleting.id);
      setFamilies((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(undefined);
      toast.success("Fonte apagada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível apagar a fonte.");
    } finally {
      setWorkingId(undefined);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <FileType2 className="size-3.5" /> Tipografia partilhada
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de fontes</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Carregue uma vez, organize as variantes e reutilize as fontes em todos os convites.
          </p>
        </div>
        <Button
          className="gap-2 shadow-sm active:scale-[0.96]"
          onClick={() => {
            setUploadFamily(undefined);
            setUploadOpen(true);
          }}
        >
          <Plus className="size-4" /> Adicionar fonte
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Famílias", summary.families],
          ["Ativas", summary.active],
          ["Arquivadas", summary.archived],
          ["Variantes", summary.variants],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl bg-muted/35 px-4 py-3 ring-1 ring-foreground/8">
            <div className="text-2xl font-semibold tabular-nums">{count}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Procurar por nome…"
            className="h-10 pl-9"
          />
        </div>
        <div className="flex rounded-lg bg-muted/50 p-1 ring-1 ring-foreground/8">
          {(["active", "archived", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setArchiveFilter(value)}
              className={`min-h-8 rounded-md px-3 text-xs font-medium transition-[background-color,box-shadow,transform] active:scale-[0.96] ${archiveFilter === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {value === "active" ? "Ativas" : value === "archived" ? "Arquivadas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> A carregar biblioteca…
        </div>
      ) : visible.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
          <FileType2 className="mb-3 size-8 text-muted-foreground/60" />
          <p className="font-medium">Nenhuma fonte encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {families.length ? "Ajuste a pesquisa ou o filtro." : "Adicione a primeira fonte à biblioteca partilhada."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((family) => (
            <article
              key={family.id}
              className="group overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="min-h-32 bg-muted/30 px-5 py-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{CATEGORY_LABELS[family.category]}</Badge>
                    {family.archived && <Badge variant="outline">Arquivada</Badge>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal /> <span className="sr-only">Ações de {family.family}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditing(family);
                        setEditName(family.family);
                        setEditCategory(family.category);
                      }}>
                        <Pencil /> Editar detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setUploadFamily(family);
                        setUploadOpen(true);
                      }}>
                        <Plus /> Adicionar variante
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => void patchFamily(family, { archived: !family.archived })}>
                        {family.archived ? <RotateCcw /> : <Archive />}
                        {family.archived ? "Restaurar" : "Arquivar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeleteUsages([]);
                          setDeleting(family);
                        }}
                      >
                        <Trash2 /> Apagar definitivamente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <FontSpecimen family={family} />
              </div>
              <div className="border-t px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{family.family}</h2>
                    <p className="text-xs text-muted-foreground">
                      {family.variants.length} variante{family.variants.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {workingId === family.id && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {family.variants.map((variant) => (
                    <span
                      key={variant.id}
                      className="rounded-md bg-muted px-2 py-1 text-[10px] tabular-nums text-muted-foreground"
                    >
                      {variant.weight}{variant.style === "italic" ? " itálico" : ""} · {variant.format.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CustomFontUploadDialog
        key={uploadFamily?.id ?? "new"}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        family={uploadFamily}
        onSaved={(saved) => {
          upsert(saved);
          setUploadOpen(false);
        }}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fonte</DialogTitle>
            <DialogDescription>O nome e a categoria aparecem em todos os seletores.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="font-family-name">Nome da família</Label>
              <Input id="font-family-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="font-family-category">Categoria</Label>
              <select
                id="font-family-category"
                value={editCategory}
                onChange={(event) => setEditCategory(event.target.value as FontCategory)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(undefined)}>Cancelar</Button>
            <Button
              disabled={!editName.trim() || workingId === editing?.id}
              onClick={async () => {
                if (!editing) return;
                const saved = await patchFamily(editing, { name: editName, fallbackCategory: editCategory });
                if (saved) {
                  setEditing(undefined);
                  toast.success("Fonte atualizada");
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar {deleting?.family}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUsages.length
                ? "Esta fonte ainda está em uso e não pode ser apagada. Substitua-a nestes locais primeiro:"
                : "Esta ação apaga todas as variantes e ficheiros. Não pode ser anulada."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUsages.length > 0 && (
            <ul className="max-h-44 space-y-1 overflow-auto rounded-lg bg-muted/50 p-3 text-sm">
              {deleteUsages.map((usage) => (
                <li key={`${usage.kind}-${usage.id}`}>
                  <span className="text-muted-foreground">{USAGE_LABELS[usage.kind]}:</span> {usage.label}
                </li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{deleteUsages.length ? "Fechar" : "Cancelar"}</AlertDialogCancel>
            {deleteUsages.length === 0 && (
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void confirmDelete();
                }}
                disabled={workingId === deleting?.id}
              >
                Apagar definitivamente
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
