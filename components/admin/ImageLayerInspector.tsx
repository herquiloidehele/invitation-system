"use client";

import { Button } from "@/components/ui/button";
import {
  EMPTY_IMAGE_LAYER,
  duplicateItem,
  removeItem,
  setItemBehind,
  updateItem,
} from "@/lib/image-layer";
import type { ImageLayer } from "@/lib/types";

interface ImageLayerInspectorProps {
  layer?: ImageLayer;
  selectedId: string | null;
  onChange: (next: ImageLayer) => void;
  onSelect: (id: string | null) => void;
}

function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Controls for the selected free-floating image. Rendered in the form's
 * "Imagens de fundo" accordion (left column) — deliberately NOT over the
 * preview, so it never covers the invitation and scrolls with the form.
 */
export default function ImageLayerInspector({
  layer = EMPTY_IMAGE_LAYER,
  selectedId,
  onChange,
  onSelect,
}: ImageLayerInspectorProps) {
  const selected = layer.items.find((i) => i.id === selectedId) ?? null;

  if (!selected) {
    return (
      <p className="text-xs text-muted-foreground">
        Selecione uma imagem na pré-visualização para editar.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <label className="block">
        Opacidade ({Math.round(selected.opacity * 100)}%)
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={selected.opacity}
          onChange={(e) =>
            onChange(
              updateItem(layer, selected.id, {
                opacity: parseFloat(e.target.value),
              }),
            )
          }
          className="w-full"
        />
      </label>
      <label className="block">
        Cantos ({selected.radiusPct}%)
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={selected.radiusPct}
          onChange={(e) =>
            onChange(
              updateItem(layer, selected.id, {
                radiusPct: parseInt(e.target.value, 10),
              }),
            )
          }
          className="w-full"
        />
      </label>
      <label className="block">
        Desfoque ({selected.blurPx}px)
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={selected.blurPx}
          onChange={(e) =>
            onChange(
              updateItem(layer, selected.id, {
                blurPx: parseInt(e.target.value, 10),
              }),
            )
          }
          className="w-full"
        />
      </label>
      <label className="block">
        Rotação ({selected.rotation}°)
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={selected.rotation}
          onChange={(e) =>
            onChange(
              updateItem(layer, selected.id, {
                rotation: parseInt(e.target.value, 10),
              }),
            )
          }
          className="w-full"
        />
      </label>
      <label className="block">
        Zoom da imagem ({selected.crop.zoom.toFixed(2)}×)
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={selected.crop.zoom}
          onChange={(e) =>
            onChange(
              updateItem(layer, selected.id, {
                crop: { ...selected.crop, zoom: parseFloat(e.target.value) },
              }),
            )
          }
          className="w-full"
        />
      </label>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant={selected.flipH ? "default" : "outline"}
          onClick={() =>
            onChange(updateItem(layer, selected.id, { flipH: !selected.flipH }))
          }
        >
          ↔
        </Button>
        <Button
          type="button"
          size="sm"
          variant={selected.flipV ? "default" : "outline"}
          onClick={() =>
            onChange(updateItem(layer, selected.id, { flipV: !selected.flipV }))
          }
        >
          ↕
        </Button>
        <Button
          type="button"
          size="sm"
          variant={selected.shadow ? "default" : "outline"}
          onClick={() =>
            onChange(
              updateItem(layer, selected.id, {
                shadow: selected.shadow
                  ? null
                  : { x: 0, y: 6, blur: 18, color: "rgba(0,0,0,0.3)" },
              }),
            )
          }
        >
          Sombra
        </Button>
        <Button
          type="button"
          size="sm"
          variant={selected.z >= 0 ? "default" : "outline"}
          onClick={() =>
            onChange(setItemBehind(layer, selected.id, false))
          }
        >
          À frente
        </Button>
        <Button
          type="button"
          size="sm"
          variant={selected.z < 0 ? "default" : "outline"}
          onClick={() => onChange(setItemBehind(layer, selected.id, true))}
        >
          Atrás
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const id = newId();
            onChange(duplicateItem(layer, selected.id, id));
            onSelect(id);
          }}
        >
          Duplicar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => {
            onChange(removeItem(layer, selected.id));
            onSelect(null);
          }}
        >
          Remover
        </Button>
      </div>
    </div>
  );
}
