import type {
  CoupleGallery,
  CoupleGalleryStyle,
  InvitationData,
} from "@/lib/types";

/** A gallery image with all optional fields resolved to concrete defaults. */
export interface ResolvedGalleryImage {
  src: string;
  caption?: string;
  positionX: number;
  positionY: number;
  zoom: number;
}

export const DEFAULT_GALLERY_STYLE: CoupleGalleryStyle = "kenburns";

function clampPct(v: number | undefined, fallback: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.min(100, Math.max(0, v));
}

function clampZoom(v: number | undefined, fallback: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.min(2.5, Math.max(1, v));
}

/** Filter out src-less images and apply per-image defaults. */
export function resolveGalleryImages(
  gallery: CoupleGallery | undefined | null,
): ResolvedGalleryImage[] {
  if (!gallery?.images?.length) return [];
  return gallery.images
    .filter((img) => !!img?.src)
    .map((img) => ({
      src: img.src,
      caption: img.caption?.trim() ? img.caption : undefined,
      positionX: clampPct(img.positionX, 50),
      positionY: clampPct(img.positionY, 50),
      zoom: clampZoom(img.zoom, 1),
    }));
}

/** True when the gallery section should render. */
export function shouldRenderCoupleGallery(
  invitation: Pick<InvitationData, "coupleGallery">,
): boolean {
  const g = invitation.coupleGallery;
  return (
    g?.enabled === true &&
    Array.isArray(g.images) &&
    g.images.some((img) => !!img?.src)
  );
}

/** Resolve autoplay with the per-style default (on for kenburns). */
export function resolveGalleryAutoplay(gallery: CoupleGallery): boolean {
  if (typeof gallery.autoplay === "boolean") return gallery.autoplay;
  return gallery.style === "kenburns";
}
