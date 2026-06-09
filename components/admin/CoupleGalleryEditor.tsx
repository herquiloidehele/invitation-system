"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MediaUpload from "@/components/admin/MediaUpload";
import ImagePositionEditor from "@/components/admin/ImagePositionEditor";
import type {
  CoupleGallery,
  CoupleGalleryImage,
  CoupleGalleryStyle,
} from "@/lib/types";

const STYLES: { value: CoupleGalleryStyle; label: string; hint: string }[] = [
  {
    value: "kenburns",
    label: "Cinematográfico",
    hint: "Zoom lento + transição suave (autoplay)",
  },
  {
    value: "coverflow",
    label: "Coverflow 3D",
    hint: "Foto central em destaque com profundidade",
  },
  { value: "polaroid", label: "Polaroids", hint: "Fotos empilhadas com legenda" },
  { value: "filmstrip", label: "Tira de Filme", hint: "Rolagem horizontal" },
  {
    value: "grid",
    label: "Mosaico",
    hint: "Grelha + visualização em ecrã inteiro",
  },
];

const EMPTY: CoupleGallery = { enabled: false, style: "kenburns", images: [] };

export default function CoupleGalleryEditor({
  value,
  onChange,
}: {
  value: CoupleGallery | undefined;
  onChange: (next: CoupleGallery) => void;
}) {
  const g = value ?? EMPTY;
  const patch = (p: Partial<CoupleGallery>) => onChange({ ...g, ...p });
  const setImages = (images: CoupleGalleryImage[]) => patch({ images });

  const addImage = (url: string) => setImages([...g.images, { src: url }]);
  const removeImage = (i: number) =>
    setImages(g.images.filter((_, idx) => idx !== i));
  const updateImage = (i: number, p: Partial<CoupleGalleryImage>) =>
    setImages(g.images.map((img, idx) => (idx === i ? { ...img, ...p } : img)));
  const move = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= g.images.length) return;
    const next = [...g.images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  };

  const showAutoplay = g.style === "kenburns" || g.style === "coverflow";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={g.enabled}
          onCheckedChange={(c) => patch({ enabled: c })}
        />
        <Label className="text-xs text-muted-foreground">
          Mostrar galeria de fotos do casal
        </Label>
      </div>

      {g.enabled && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Estilo</Label>
            <div className="grid grid-cols-1 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => patch({ style: s.value })}
                  className={`text-left rounded-lg border px-3 py-2 ${
                    g.style === s.value
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {showAutoplay && (
            <div className="flex items-center gap-3">
              <Switch
                checked={g.autoplay ?? g.style === "kenburns"}
                onCheckedChange={(c) => patch({ autoplay: c })}
              />
              <Label className="text-xs text-muted-foreground">
                Reprodução automática
              </Label>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Título da secção (opcional)</Label>
            <Input
              value={g.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Nossos Momentos"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs">Fotos ({g.images.length})</Label>

            {g.images.map((img, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Foto {i + 1}
                  </span>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={i === 0}
                      onClick={() => move(i, "up")}
                      aria-label="Mover para cima"
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={i === g.images.length - 1}
                      onClick={() => move(i, "down")}
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeImage(i)}
                      aria-label="Remover"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <ImagePositionEditor
                  src={img.src}
                  settings={{
                    positionX: img.positionX ?? 50,
                    positionY: img.positionY ?? 50,
                    zoom: img.zoom ?? 1,
                  }}
                  onChange={(s) =>
                    updateImage(i, {
                      positionX: s.positionX,
                      positionY: s.positionY,
                      zoom: s.zoom,
                    })
                  }
                />

                <Input
                  value={img.caption ?? ""}
                  onChange={(e) => updateImage(i, { caption: e.target.value })}
                  placeholder="Legenda (opcional)"
                />
              </div>
            ))}

            {g.images.length >= 15 && (
              <p className="text-[11px] text-amber-600">
                Recomendamos no máximo 15 fotos para melhor desempenho.
              </p>
            )}

            <MediaUpload
              kind="image"
              maxSizeMB={5}
              onUpload={(url) => addImage(url)}
              onClear={() => {}}
              label="Adicionar foto"
            />
          </div>
        </>
      )}
    </div>
  );
}
