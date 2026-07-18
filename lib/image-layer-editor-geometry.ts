import { clampPos } from "./image-layer";
import type { ImageItem, ImageLayerSectionKey } from "./types";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ImageAnchorRect extends Rect {
  sectionKey: ImageLayerSectionKey;
}

/**
 * Resolve the vertical section that should own an image centre. Invitation
 * layouts are a single vertical column, so horizontal spill must not affect
 * anchor selection.
 */
export function findImageAnchorRect(
  rects: readonly ImageAnchorRect[],
  clientY: number,
): ImageAnchorRect | null {
  const containing = rects.find(
    (rect) => clientY >= rect.top && clientY <= rect.top + rect.height,
  );
  if (containing) return containing;

  return rects.reduce<ImageAnchorRect | null>((nearest, rect) => {
    if (!nearest) return rect;
    const distance = Math.min(
      Math.abs(clientY - rect.top),
      Math.abs(clientY - (rect.top + rect.height)),
    );
    const nearestDistance = Math.min(
      Math.abs(clientY - nearest.top),
      Math.abs(clientY - (nearest.top + nearest.height)),
    );
    return distance < nearestDistance ? rect : nearest;
  }, null);
}

/**
 * Find the element that clips and scrolls the invitation preview. The preview
 * content root can be height-limited while its canvas continues below it, so
 * it must not be used as the interaction overlay's clipping boundary.
 */
export function findImageEditorViewport<T extends { parentElement: T | null }>(
  start: T,
  readOverflow: (element: T) => string,
): T {
  let element: T | null = start;
  while (element) {
    if (/\b(auto|scroll)\b/.test(readOverflow(element))) {
      return element;
    }
    element = element.parentElement;
  }
  return start;
}

/** Center-relative position of a client point as % of the page canvas box. */
export function clientToCanvasPct(
  rect: Rect,
  clientX: number,
  clientY: number,
): { xPct: number; yPct: number } {
  return {
    xPct: rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0,
    yPct: rect.height > 0 ? ((clientY - rect.top) / rect.height) * 100 : 0,
  };
}

/** Center of the visible preview viewport expressed in canvas percentages. */
export function visibleViewportCenterPct(
  canvas: Rect,
  viewport: Rect,
): { xPct: number; yPct: number } {
  return clientToCanvasPct(
    canvas,
    viewport.left + viewport.width / 2,
    viewport.top + viewport.height / 2,
  );
}

/** A pixel width as a percentage of the canvas width. */
export function widthPxToPct(px: number, rect: Rect): number {
  return rect.width > 0 ? (px / rect.width) * 100 : 0;
}

/** Resolve stored percentage geometry to viewport pixels for one anchor. */
export function pixelGeometryFromPercent(
  rect: Rect,
  xPct: number,
  yPct: number,
  widthPct: number,
): { centerX: number; centerY: number; widthPx: number } {
  return {
    centerX: rect.left + (xPct / 100) * rect.width,
    centerY: rect.top + (yPct / 100) * rect.height,
    widthPx: (widthPct / 100) * rect.width,
  };
}

/** Express viewport pixel geometry in a new anchor's percentage coordinates. */
export function percentGeometryFromPixels(
  rect: Rect,
  centerX: number,
  centerY: number,
  widthPx: number,
): { xPct: number; yPct: number; widthPct: number } {
  return {
    ...clientToCanvasPct(rect, centerX, centerY),
    widthPct: widthPxToPct(widthPx, rect),
  };
}

/** Convert legacy page-relative items to the nearest measurable section. */
export function migrateLegacyImageItems(
  items: readonly ImageItem[],
  canvas: Rect,
  sections: readonly ImageAnchorRect[],
): readonly ImageItem[] {
  if (sections.length === 0 || items.every((item) => item.sectionKey)) {
    return items;
  }

  let changed = false;
  const migrated = items.map((item) => {
    if (item.sectionKey) return item;

    const pixels = pixelGeometryFromPercent(
      canvas,
      item.xPct,
      item.yPct,
      item.widthPct,
    );
    const anchor = findImageAnchorRect(sections, pixels.centerY);
    if (!anchor) return item;

    const geometry = percentGeometryFromPixels(
      anchor,
      pixels.centerX,
      pixels.centerY,
      pixels.widthPx,
    );
    changed = true;
    return {
      ...item,
      sectionKey: anchor.sectionKey,
      xPct: clampPos(geometry.xPct),
      yPct: clampPos(geometry.yPct),
      widthPct: geometry.widthPct,
    };
  });

  return changed ? migrated : items;
}

/** New box width (% of canvas) from a corner pointer relative to box center. */
export function resizeWidthPct(
  center: { centerX: number; centerY: number },
  pointerX: number,
  pointerY: number,
  rect: Rect,
): number {
  const halfW = Math.abs(pointerX - center.centerX);
  const fullW = halfW * 2;
  const pct = rect.width > 0 ? (fullW / rect.width) * 100 : 0;
  return Math.max(2, pct);
}

/** Rotation (deg, 0 = up, clockwise positive) from box center to a pointer. */
export function rotationFromPointer(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number,
): number {
  const angle =
    Math.atan2(pointerX - centerX, centerY - pointerY) * (180 / Math.PI);
  return Math.round(angle);
}
