export type UploadFolder = "images" | "videos" | "audio" | "documents";

const DEFAULT_MAX_SIZES: Record<UploadFolder, number> = {
  images: 5 * 1024 * 1024,
  videos: 100 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  // Reference PDFs (brand guides, proofs) for the AI builder. Large enough to
  // be useful, small enough that reading one does not dominate a build's cost.
  documents: 10 * 1024 * 1024,
};

const RSVP_BACKGROUND_MAX_BYTES = 500 * 1024;
const HERO_VIDEO_MAX_BYTES = 500 * 1024 * 1024;

export function getUploadMaxSizeBytes(
  folder: UploadFolder,
  profile?: string,
): number {
  if (profile === "rsvp-background" && folder === "images") {
    return RSVP_BACKGROUND_MAX_BYTES;
  }

  if (profile === "hero-video" && folder === "videos") {
    return HERO_VIDEO_MAX_BYTES;
  }

  return DEFAULT_MAX_SIZES[folder];
}

export function formatUploadLimit(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${Math.round(sizeBytes / 1024 / 1024)} MB`;
}
