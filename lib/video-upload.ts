export const HERO_VIDEO_UPLOAD_PROFILE = "hero-video";

export interface ProcessedVideoUpload {
  url: string;
  posterUrl: string;
}

const MISSING_VIDEO_ASSETS_MESSAGE =
  "O processamento não produziu o vídeo e o poster obrigatórios.";

export function parseProcessedVideoUpload(
  value: unknown,
): ProcessedVideoUpload {
  if (!value || typeof value !== "object") {
    throw new Error(MISSING_VIDEO_ASSETS_MESSAGE);
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.url !== "string" ||
    candidate.url.trim() === "" ||
    typeof candidate.posterUrl !== "string" ||
    candidate.posterUrl.trim() === ""
  ) {
    throw new Error(MISSING_VIDEO_ASSETS_MESSAGE);
  }

  return { url: candidate.url, posterUrl: candidate.posterUrl };
}
