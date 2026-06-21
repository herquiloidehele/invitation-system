"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import MediaUpload from "@/components/admin/MediaUpload";
import type { LocationPhoto } from "@/lib/types";

/**
 * Per-venue photo carousel editor for the Elegant Floral layout. Add, reorder,
 * and remove photos; each uses the shared S3 MediaUpload. Modeled on
 * CoupleGalleryEditor.
 */
export default function LocationPhotosEditor({
  value,
  onChange,
}: {
  value: LocationPhoto[] | undefined;
  onChange: (next: LocationPhoto[]) => void;
}) {
  const photos = value ?? [];

  const update = (i: number, p: Partial<LocationPhoto>) =>
    onChange(photos.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const remove = (i: number) => onChange(photos.filter((_, j) => j !== i));
  const move = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Carrossel de fotos do local</Label>

      {photos.map((ph, i) => (
        <div key={i} className="space-y-2 rounded-md border p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Foto {i + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => move(i, "up")}
                disabled={i === 0}
              >
                <ChevronUp size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => move(i, "down")}
                disabled={i === photos.length - 1}
              >
                <ChevronDown size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          <MediaUpload
            kind="image"
            maxSizeMB={5}
            value={ph.src || undefined}
            onUpload={(url) => update(i, { src: url })}
            onClear={() => update(i, { src: "" })}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...photos, { src: "" }])}
      >
        <Plus size={14} className="mr-1" /> Adicionar foto
      </Button>
    </div>
  );
}
