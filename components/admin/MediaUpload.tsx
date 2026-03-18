"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import {
  ImageIcon,
  VideoIcon,
  MusicIcon,
  UploadCloudIcon,
  XCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaKind = "image" | "video" | "audio";

interface MediaUploadProps {
  /** Current value (an S3 URL or existing URL) */
  value?: string;
  /** Called when a new file has been uploaded and we have a public URL */
  onUpload: (url: string) => void;
  /** Called when the user clears the current value */
  onClear: () => void;
  /** The kind of media to accept */
  kind: MediaKind;
  /** Max file size in MB */
  maxSizeMB: number;
  /** Optional label override for the drop zone */
  label?: string;
  className?: string;
}

type UploadState =
  | { status: "idle" }
  | { status: "compressing" }
  | { status: "uploading"; progress: number }
  | { status: "done"; url: string }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCEPT_MAP: Record<MediaKind, Record<string, string[]>> = {
  image: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"] },
  video: { "video/*": [".mp4", ".webm", ".ogg", ".mov", ".avi"] },
  audio: { "audio/*": [".mp3", ".ogg", ".wav", ".aac", ".flac", ".webm"] },
};

const KIND_LABEL: Record<MediaKind, string> = {
  image: "imagem",
  video: "vídeo",
  audio: "áudio",
};

const KIND_ICON: Record<MediaKind, React.ElementType> = {
  image: ImageIcon,
  video: VideoIcon,
  audio: MusicIcon,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isS3Url(url: string): boolean {
  return url.includes(".amazonaws.com/") || url.startsWith("https://");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MediaUpload({
  value,
  onUpload,
  onClear,
  kind,
  maxSizeMB,
  label,
  className,
}: MediaUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");

  const KindIcon = KIND_ICON[kind];
  const kindLabel = KIND_LABEL[kind];

  const handleFile = useCallback(
    async (file: File) => {
      setUploadState({ status: "idle" });

      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setUploadState({
          status: "error",
          message: `O ficheiro excede o limite de ${maxSizeMB} MB.`,
        });
        return;
      }

      try {
        let fileToUpload = file;

        // Compress images client-side before uploading
        if (kind === "image") {
          setUploadState({ status: "compressing" });
          fileToUpload = await imageCompression(file, {
            maxSizeMB: Math.min(maxSizeMB, 2),
            maxWidthOrHeight: 2560,
            useWebWorker: true,
            fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
          });
        }

        // Request presigned URL
        setUploadState({ status: "uploading", progress: 0 });

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: fileToUpload.type || file.type,
            fileSize: fileToUpload.size,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error ?? "Falha ao obter URL de upload.");
        }

        const { presignedUrl, publicUrl } = await presignRes.json();

        // Upload directly to S3 with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl, true);
          xhr.setRequestHeader("Content-Type", fileToUpload.type || file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploadState({ status: "uploading", progress });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload falhou com status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Erro de rede durante o upload."));
          xhr.send(fileToUpload);
        });

        setUploadState({ status: "done", url: publicUrl });
        onUpload(publicUrl);
      } catch (err) {
        setUploadState({
          status: "error",
          message: err instanceof Error ? err.message : "Erro desconhecido.",
        });
      }
    },
    [kind, maxSizeMB, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT_MAP[kind],
    maxFiles: 1,
    onDropAccepted: ([file]) => handleFile(file),
    onDropRejected: (rejected) => {
      const err = rejected[0]?.errors[0];
      setUploadState({
        status: "error",
        message: err?.message ?? "Ficheiro rejeitado.",
      });
    },
    disabled: uploadState.status === "compressing" || uploadState.status === "uploading",
    noClick: !!value,
    noDrag: !!value,
  });

  const handleClear = () => {
    setUploadState({ status: "idle" });
    setShowUrlInput(false);
    setUrlInputValue("");
    onClear();
  };

  const handleUrlConfirm = () => {
    if (urlInputValue.trim()) {
      onUpload(urlInputValue.trim());
      setShowUrlInput(false);
      setUrlInputValue("");
    }
  };

  // ── Render: has a value (uploaded or existing URL) ──
  if (value) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative rounded-lg border bg-muted/30 overflow-hidden">
          {/* Preview */}
          {kind === "image" && (
            <div className="relative w-full h-40 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          {kind === "video" && (
            <video
              src={value}
              controls
              className="w-full max-h-40 object-contain bg-black"
            />
          )}
          {kind === "audio" && (
            <div className="flex items-center gap-3 p-4">
              <MusicIcon className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <audio src={value} controls className="w-full" />
              </div>
            </div>
          )}

          {/* URL chip */}
          <div className="flex items-center gap-2 px-3 py-2 bg-background/80 border-t">
            <CheckCircle2Icon className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1">
              {value.length > 60 ? `...${value.slice(-55)}` : value}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              <XCircleIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: uploading / compressing ──
  if (uploadState.status === "compressing" || uploadState.status === "uploading") {
    const isCompressing = uploadState.status === "compressing";
    const progress = uploadState.status === "uploading" ? uploadState.progress : 0;

    return (
      <div className={cn("rounded-lg border bg-muted/30 p-6", className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium">
            {isCompressing ? "A comprimir imagem..." : `A carregar... ${progress}%`}
          </p>
          {!isCompressing && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: drop zone (idle / error) ──
  return (
    <div className={cn("space-y-2", className)}>
      {/* URL paste input (toggle) */}
      {showUrlInput ? (
        <div className="flex gap-2">
          <Input
            placeholder={`Cole um URL de ${kindLabel}...`}
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlConfirm()}
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleUrlConfirm}>
            OK
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlInput(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
              uploadState.status === "error" && "border-destructive/50 bg-destructive/5",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
              <div className="rounded-full bg-muted p-3">
                {isDragActive ? (
                  <UploadCloudIcon className="h-6 w-6 text-primary" />
                ) : (
                  <KindIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragActive
                    ? `Solte o ficheiro aqui`
                    : `Arraste um ficheiro de ${kindLabel}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ou{" "}
                  <span className="text-primary underline underline-offset-2 cursor-pointer pointer-events-auto">
                    clique para selecionar
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {kind === "image" && "JPG, PNG, WebP, AVIF"}
                {kind === "video" && "MP4, WebM, MOV"}
                {kind === "audio" && "MP3, WAV, OGG, AAC"}
                {" · "}Máx. {maxSizeMB} MB
                {kind === "image" && " (comprimido automaticamente)"}
              </p>
            </div>
          </div>

          {/* Error message */}
          {uploadState.status === "error" && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <XCircleIcon className="h-3.5 w-3.5 shrink-0" />
              {uploadState.message}
            </p>
          )}

          {/* URL fallback */}
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkIcon className="h-3 w-3" />
            Ou cole um URL directamente
          </button>
        </>
      )}
    </div>
  );
}
