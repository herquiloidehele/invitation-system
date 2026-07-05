"use client";

import { toast } from "sonner";

import MediaUpload from "@/components/admin/MediaUpload";
import { EMPTY_IMAGE_LAYER, addItem, canAddItem } from "@/lib/image-layer";
import {
  findImageEditorViewport,
  visibleViewportCenterPct,
} from "@/lib/image-layer-editor-geometry";
import type { ImageLayer } from "@/lib/types";

interface ImageLayerUploaderProps {
  value?: ImageLayer;
  onChange: (next: ImageLayer) => void;
  /** Returns the live-preview scroll root (contains the [data-image-canvas]). */
  getPreviewRoot: () => HTMLElement | null;
  /** Called with the new item's id after it is added (to select + position it). */
  onAdded?: (id: string) => void;
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
 * Upload control for the free-floating image layer. Lives in the form's
 * "Imagens de fundo" accordion. New images are dropped at the centre of the
 * currently-visible preview area so they land in view, ready to be dragged.
 */
export default function ImageLayerUploader({
  value,
  onChange,
  getPreviewRoot,
  onAdded,
}: ImageLayerUploaderProps) {
  const layer = value ?? EMPTY_IMAGE_LAYER;

  const handleUploaded = (url: string) => {
    const check = canAddItem(layer);
    if (!check.ok) {
      toast.error(check.reason ?? "Limite de imagens atingido.");
      return;
    }
    const img = new Image();
    img.onload = () => {
      const aspect =
        img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
      let xPct = 50;
      let yPct = 50;
      const root = getPreviewRoot();
      const canvasEl = root?.querySelector(
        "[data-image-canvas]",
      ) as HTMLElement | null;
      if (root && canvasEl) {
        const viewport = findImageEditorViewport(root, (element) => {
          const style = window.getComputedStyle(element);
          return `${style.overflow} ${style.overflowX} ${style.overflowY}`;
        });
        const vr = viewport.getBoundingClientRect();
        const cr = canvasEl.getBoundingClientRect();
        const p = visibleViewportCenterPct(
          { left: cr.left, top: cr.top, width: cr.width, height: cr.height },
          { left: vr.left, top: vr.top, width: vr.width, height: vr.height },
        );
        xPct = p.xPct;
        yPct = p.yPct;
      }
      const id = newId();
      onChange(
        addItem(layer, { id, src: url, naturalAspect: aspect, xPct, yPct }),
      );
      onAdded?.(id);
    };
    img.src = url;
  };

  return (
    <MediaUpload
      kind="image"
      maxSizeMB={8}
      value={undefined}
      onUpload={handleUploaded}
      onClear={() => {}}
      label="Carregar imagem"
    />
  );
}
