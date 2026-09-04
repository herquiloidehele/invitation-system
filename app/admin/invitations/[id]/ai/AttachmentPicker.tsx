"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";

// Type-only: keeps Prisma (and the whole worker module) out of the browser bundle.
import type { AttachmentRecord } from "@/worker/persistence";
import { Button } from "@/components/ui/button";

/** Natural dimensions of an image file, so the bundle can size it correctly. */
async function imageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AttachmentPicker({
  slug,
  attachments,
  onAttach,
  onRemove,
  disabled,
}: {
  slug: string;
  attachments: AttachmentRecord[];
  onAttach: (a: AttachmentRecord) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setPending((p) => [...p, file.name]);
    setError(null);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      if (!presignRes.ok) {
        setError(
          (await presignRes.json()).error ?? "Falha ao preparar o envio.",
        );
        return;
      }
      const presigned = (await presignRes.json()) as {
        presignedUrl: string;
        publicUrl: string;
        key: string;
      };

      const put = await fetch(presigned.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError("Falha ao carregar o ficheiro.");
        return;
      }

      const size = await imageSize(file);
      const res = await fetch("/api/admin/ai/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: file.name,
          mimeType: file.type,
          objectKey: presigned.key,
          url: presigned.publicUrl,
          sizeBytes: file.size,
          width: size?.width,
          height: size?.height,
        }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? "Falha ao registar o ficheiro.");
        return;
      }
      onAttach((await res.json()).attachment as AttachmentRecord);
    } catch {
      setError("Falha ao carregar o ficheiro.");
    } finally {
      setPending((p) => p.filter((n) => n !== file.name));
    }
  };

  const handleFiles = (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) void upload(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className="space-y-2"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {(attachments.length > 0 || pending.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
            >
              {a.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.url}
                  alt=""
                  className="size-5 rounded object-cover"
                />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="max-w-[10rem] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                aria-label={`Remover ${a.name}`}
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
        <Paperclip className="size-4" /> Anexar ficheiro
      </Button>
    </div>
  );
}
