/**
 * Client-side image compression options for uploads.
 *
 * Shaped for `browser-image-compression`; kept as a pure function so the
 * format/budget decision is unit-testable without a DOM. `MediaUpload` calls
 * this, then hands the result straight to `imageCompression`.
 */
export interface ImageCompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
}

/** Upload profile for the invitation's tiling page background. */
export const PAGE_BACKGROUND_PROFILE = "page-background";

/**
 * Decide how (or whether) to compress an image before upload.
 *
 * SVG (vector) and GIF (often animated) return `null` — canvas compression
 * would rasterise or flatten them, so they upload untouched.
 *
 * A page background is downloaded before the page settles and, as a
 * non-interlaced PNG, paints in horizontal bands while it streams. So a
 * background is always transcoded to WebP and held to a small budget
 * regardless of the source format — the same damask that ships as a 721 KB PNG
 * is ~19 KB as WebP, arriving in a single window with no banding.
 *
 * Every other image keeps its source format (JPEG stays JPEG) under a 2 MB
 * ceiling, so ordinary photo uploads are unchanged.
 */
export function resolveImageCompression(params: {
  fileType: string;
  maxSizeMB: number;
  uploadProfile?: string;
}): ImageCompressionOptions | null {
  const { fileType, maxSizeMB, uploadProfile } = params;

  if (fileType === "image/svg+xml" || fileType === "image/gif") {
    return null;
  }

  if (uploadProfile === PAGE_BACKGROUND_PROFILE) {
    return {
      maxSizeMB: 0.4,
      // The source never needs to exceed ~2x the invitation column; this only
      // downscales oversized art and never upscales a smaller pattern.
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/webp",
    };
  }

  return {
    maxSizeMB: Math.min(maxSizeMB, 2),
    maxWidthOrHeight: 2560,
    useWebWorker: true,
    fileType,
  };
}
