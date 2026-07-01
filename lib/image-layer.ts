import type { CSSProperties } from "react";

import type { ImageItem, ImageLayer } from "./types";

export const EMPTY_IMAGE_LAYER: ImageLayer = { items: [] };

/** Soft cap to keep the DOM / mobile-webview memory in check. */
export const MAX_ITEMS_TOTAL = 24;

/** Defaults for a freshly-added item (id/src/naturalAspect/aspect supplied separately). */
export const DEFAULT_IMAGE_ITEM: Omit<
  ImageItem,
  "id" | "src" | "naturalAspect" | "aspect"
> = {
  xPct: 50,
  yPct: 50,
  widthPct: 40,
  rotation: 0,
  flipH: false,
  flipV: false,
  opacity: 1,
  radiusPct: 0,
  blurPx: 0,
  shadow: null,
  crop: { offsetXPct: 50, offsetYPct: 50, zoom: 1 },
  z: 1,
};

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

/** Clamp a position percentage; allows mild spill beyond the page canvas. */
export function clampPos(value: number): number {
  return clampNumber(value, -50, 150, 0);
}

function nextZ(layer: ImageLayer): number {
  if (layer.items.length === 0) return 1;
  return layer.items.reduce((max, i) => Math.max(max, i.z), -Infinity) + 1;
}

function prevZ(layer: ImageLayer): number {
  if (layer.items.length === 0) return -1;
  return layer.items.reduce((min, i) => Math.min(min, i.z), Infinity) - 1;
}

function normalizeItem(raw: unknown, index: number): ImageItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.src !== "string" || !r.src) return null;
  const crop = (r.crop ?? {}) as Record<string, unknown>;
  const shadowRaw = r.shadow as Record<string, unknown> | null | undefined;
  const shadow =
    shadowRaw && typeof shadowRaw === "object"
      ? {
          x: clampNumber(shadowRaw.x, -100, 100, 0),
          y: clampNumber(shadowRaw.y, -100, 100, 4),
          blur: clampNumber(shadowRaw.blur, 0, 100, 12),
          color:
            typeof shadowRaw.color === "string"
              ? shadowRaw.color
              : "rgba(0,0,0,0.35)",
        }
      : null;
  return {
    id: typeof r.id === "string" && r.id ? r.id : `img-${index}`,
    src: r.src,
    naturalAspect: clampNumber(r.naturalAspect, 0.05, 20, 1),
    xPct: clampPos(typeof r.xPct === "number" ? r.xPct : 50),
    yPct: clampPos(typeof r.yPct === "number" ? r.yPct : 50),
    widthPct: clampNumber(r.widthPct, 2, 200, 40),
    aspect: clampNumber(r.aspect, 0.05, 20, 1),
    rotation: clampNumber(r.rotation, -180, 180, 0),
    flipH: r.flipH === true,
    flipV: r.flipV === true,
    opacity: clampNumber(r.opacity, 0, 1, 1),
    radiusPct: clampNumber(r.radiusPct, 0, 50, 0),
    blurPx: clampNumber(r.blurPx, 0, 20, 0),
    shadow,
    crop: {
      offsetXPct: clampNumber(crop.offsetXPct, 0, 100, 50),
      offsetYPct: clampNumber(crop.offsetYPct, 0, 100, 50),
      zoom: clampNumber(crop.zoom, 1, 4, 1),
    },
    z: clampNumber(r.z, -9999, 9999, index + 1),
  };
}

/** Coerce arbitrary JSON (DB or form) into a safe ImageLayer. */
export function normalizeImageLayer(value: unknown): ImageLayer {
  if (!value || typeof value !== "object") return EMPTY_IMAGE_LAYER;
  const v = value as Record<string, unknown>;
  const items = Array.isArray(v.items)
    ? v.items
        .map((it, i) => normalizeItem(it, i))
        .filter((it): it is ImageItem => it !== null)
    : [];
  return { items };
}

export function canAddItem(layer: ImageLayer): { ok: boolean; reason?: string } {
  if (layer.items.length >= MAX_ITEMS_TOTAL) {
    return {
      ok: false,
      reason: `Máximo de ${MAX_ITEMS_TOTAL} imagens por convite.`,
    };
  }
  return { ok: true };
}

export function addItem(
  layer: ImageLayer,
  init: {
    id: string;
    src: string;
    naturalAspect: number;
    xPct?: number;
    yPct?: number;
    widthPct?: number;
  },
): ImageLayer {
  const item: ImageItem = {
    ...DEFAULT_IMAGE_ITEM,
    id: init.id,
    src: init.src,
    naturalAspect: init.naturalAspect,
    aspect: init.naturalAspect,
    xPct: init.xPct ?? DEFAULT_IMAGE_ITEM.xPct,
    yPct: init.yPct ?? DEFAULT_IMAGE_ITEM.yPct,
    widthPct: init.widthPct ?? DEFAULT_IMAGE_ITEM.widthPct,
    z: nextZ(layer),
  };
  return { items: [...layer.items, item] };
}

export function updateItem(
  layer: ImageLayer,
  id: string,
  patch: Partial<ImageItem>,
): ImageLayer {
  return {
    items: layer.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  };
}

export function removeItem(layer: ImageLayer, id: string): ImageLayer {
  return { items: layer.items.filter((i) => i.id !== id) };
}

export function duplicateItem(
  layer: ImageLayer,
  id: string,
  newId: string,
): ImageLayer {
  const source = layer.items.find((i) => i.id === id);
  if (!source) return layer;
  const copy: ImageItem = {
    ...source,
    id: newId,
    xPct: clampPos(source.xPct + 4),
    yPct: clampPos(source.yPct + 4),
    z: nextZ(layer),
  };
  return { items: [...layer.items, copy] };
}

export function moveItem(
  layer: ImageLayer,
  id: string,
  xPct: number,
  yPct: number,
): ImageLayer {
  return updateItem(layer, id, {
    xPct: clampPos(xPct),
    yPct: clampPos(yPct),
  });
}

export function bringToFront(layer: ImageLayer, id: string): ImageLayer {
  return updateItem(layer, id, { z: nextZ(layer) });
}

export function sendToBack(layer: ImageLayer, id: string): ImageLayer {
  return updateItem(layer, id, { z: prevZ(layer) });
}

/** Toggle whether the item sits behind (z<0) or in front of (z>=0) content. */
export function setItemBehind(
  layer: ImageLayer,
  id: string,
  behind: boolean,
): ImageLayer {
  const item = layer.items.find((i) => i.id === id);
  if (!item) return layer;
  const mag = Math.max(1, Math.abs(item.z));
  return updateItem(layer, id, { z: behind ? -mag : mag });
}

export function imageItemBoxStyle(item: ImageItem): CSSProperties {
  const sx = item.flipH ? -1 : 1;
  const sy = item.flipV ? -1 : 1;
  return {
    position: "absolute",
    left: `${item.xPct}%`,
    top: `${item.yPct}%`,
    width: `${item.widthPct}%`,
    aspectRatio: `${item.aspect}`,
    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${sx}, ${sy})`,
    transformOrigin: "center",
    zIndex: item.z,
  };
}

export function imageItemFrameStyle(item: ImageItem): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    borderRadius: `${item.radiusPct}%`,
    overflow: "hidden",
    opacity: item.opacity,
    filter: item.blurPx > 0 ? `blur(${item.blurPx}px)` : undefined,
    boxShadow: item.shadow
      ? `${item.shadow.x}px ${item.shadow.y}px ${item.shadow.blur}px ${item.shadow.color}`
      : undefined,
  };
}

export function imageItemImgStyle(item: ImageItem): CSSProperties {
  return {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${item.crop.offsetXPct}% ${item.crop.offsetYPct}%`,
    transform: `scale(${item.crop.zoom})`,
  };
}
