/**
 * The contract between the admin console (parent) and the preview page
 * (iframe) for capturing the rendered invitation. Same-origin only; both
 * sides check `event.origin`. No imports: this is shared by the public page
 * and the admin bundle.
 */
export const AI_PREVIEW_READY = "ai-preview-ready";
export const AI_PREVIEW_CAPTURE = "ai-preview-capture";
export const AI_PREVIEW_CAPTURED = "ai-preview-captured";

export type CaptureRequest = {
  type: typeof AI_PREVIEW_CAPTURE;
  requestId: string;
  maxTiles: number;
};
export type CaptureResult = {
  type: typeof AI_PREVIEW_CAPTURED;
  requestId: string;
  /** JPEG data URLs, top-to-bottom. Empty on failure. */
  tiles: string[];
  error?: string;
};

/** CSS px per tile — keeps type legible after the API downsamples to ~1568px. */
export const TILE_HEIGHT_PX = 1400;
/** The review looks at the phone layout only — that is how guests open it. */
export const MAX_TILES = 4;
export const PIXEL_RATIO = 1.5;
export const JPEG_QUALITY = 0.75;

/**
 * How much of the page to rasterise: the tile cap bounds it, so a very long
 * invitation costs a fixed amount of memory and review tokens.
 */
export function captureHeight(scrollHeight: number, maxTiles: number): number {
  return Math.max(1, Math.min(scrollHeight, TILE_HEIGHT_PX * maxTiles));
}

/** Cut a rendered canvas into vertical tiles, top-to-bottom. */
export function sliceCanvas(
  canvas: HTMLCanvasElement,
  tileHeightPx: number,
  maxTiles: number,
): string[] {
  const tiles: string[] = [];
  for (
    let y = 0;
    y < canvas.height && tiles.length < maxTiles;
    y += tileHeightPx
  ) {
    const h = Math.min(tileHeightPx, canvas.height - y);
    const tile = document.createElement("canvas");
    tile.width = canvas.width;
    tile.height = h;
    tile
      .getContext("2d")!
      .drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    tiles.push(tile.toDataURL("image/jpeg", JPEG_QUALITY));
  }
  return tiles;
}
