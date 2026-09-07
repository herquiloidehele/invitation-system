"use client";

import { useRef, useState } from "react";
import { Loader2, Type, X } from "lucide-react";

// Type-only: keeps Prisma (and the whole worker module) out of the browser bundle.
import type { FontAssetRecord } from "@/worker/persistence";
import type { CustomFontAnalysis } from "@/lib/custom-fonts/types";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".woff2,.woff,.ttf,.otf";

async function jsonError(res: Response, fallback: string): Promise<string> {
  return ((await res.json().catch(() => ({}))).error as string) ?? fallback;
}

/**
 * Upload a font in the AI builder. It runs the shared custom-font pipeline
 * (presign → analyse → get-or-create the global family) and then links the
 * font to this invitation so the agent is told to apply it. The weight/style
 * are auto-accepted from the file's own metadata — no form.
 */
export default function FontUploadControl({
  slug,
  fonts,
  onAdd,
  onRemove,
  disabled,
}: {
  slug: string;
  fonts: FontAssetRecord[];
  onAdd: (f: FontAssetRecord) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!/\.(woff2|woff|ttf|otf)$/i.test(file.name)) {
      setError("Formato de fonte não suportado (use WOFF2, WOFF, TTF ou OTF).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("A fonte excede o limite de 10 MB.");
      return;
    }
    const fileType = file.type || "application/octet-stream";
    setPending((p) => [...p, file.name]);
    try {
      const presignRes = await fetch("/api/admin/custom-fonts/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType,
          fileSize: file.size,
        }),
      });
      if (!presignRes.ok) {
        setError(await jsonError(presignRes, "Falha ao preparar o envio."));
        return;
      }
      const { presignedUrl, pendingKey } = (await presignRes.json()) as {
        presignedUrl: string;
        pendingKey: string;
      };

      const put = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": fileType },
        body: file,
      });
      if (!put.ok) {
        setError("Falha ao carregar a fonte.");
        return;
      }

      const analyzeRes = await fetch("/api/admin/custom-fonts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingKey }),
      });
      if (!analyzeRes.ok) {
        setError(await jsonError(analyzeRes, "A fonte não pôde ser validada."));
        return;
      }
      const analysis = (await analyzeRes.json()) as CustomFontAnalysis;

      const res = await fetch("/api/admin/ai/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          pendingKey,
          originalFileName: file.name,
          familyName: analysis.familyName,
          checksum: analysis.checksum,
          weight: analysis.weight,
          style: analysis.style,
        }),
      });
      if (!res.ok) {
        setError(await jsonError(res, "Falha ao registar a fonte."));
        return;
      }
      onAdd((await res.json()).font as FontAssetRecord);
    } catch {
      setError("Falha ao carregar a fonte.");
    } finally {
      setPending((p) => p.filter((n) => n !== file.name));
    }
  };

  const handleFiles = (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) void upload(file);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {(fonts.length > 0 || pending.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {fonts.map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
            >
              <Type className="size-4 text-muted-foreground" />
              <span className="max-w-[10rem] truncate">{f.family}</span>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                aria-label={`Remover ${f.family}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {pending.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground"
            >
              <Loader2 className="size-3 animate-spin" />
              <span className="max-w-[10rem] truncate">{name}</span>
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Type className="size-4" /> Carregar fonte
      </Button>
    </div>
  );
}
