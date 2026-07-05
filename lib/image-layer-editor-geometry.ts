export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
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
