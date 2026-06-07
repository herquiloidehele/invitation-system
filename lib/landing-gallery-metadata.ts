type LandingGalleryMetadataInput = {
  couple: unknown;
  landingModelName?: string | null;
  landingDescription?: string | null;
};

function readCouple(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const couple = value as Record<string, unknown>;
  const bride = typeof couple.bride === "string" ? couple.bride : "";
  const groom = typeof couple.groom === "string" ? couple.groom : "";
  return [bride, groom].filter(Boolean).join(" & ");
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveLandingGalleryMetadata(
  input: LandingGalleryMetadataInput,
) {
  return {
    title: normalizeText(input.landingModelName) ?? readCouple(input.couple),
    description: normalizeText(input.landingDescription),
    couple: readCouple(input.couple) || "",
  };
}
