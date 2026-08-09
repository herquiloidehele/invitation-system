export const LANDING_PRODUCT_KINDS = ["convite", "save-the-date"] as const;

export type LandingProductKind = (typeof LANDING_PRODUCT_KINDS)[number];

export type LandingProductDetailContentKey =
  | "invitationEyebrow"
  | "saveTheDateEyebrow"
  | "invitationIncludedBody"
  | "saveTheDateIncludedBody"
  | "fullyCustomizableBody"
  | "preDesignedBody"
  | "fullyCustomizableTag"
  | "preDesignedTag"
  | "rsvpTag"
  | "mapsTag";

export function parseLandingProductKind(
  value: unknown,
): LandingProductKind | null {
  return typeof value === "string" &&
    LANDING_PRODUCT_KINDS.includes(value as LandingProductKind)
    ? (value as LandingProductKind)
    : null;
}

export function buildLandingProductDetailsPath(
  kind: LandingProductKind,
  slug: string,
): string {
  return `/modelos/${kind}/${encodeURIComponent(slug)}`;
}

export function getLandingProductDetailContentKeys(
  kind: LandingProductKind,
  customizationLevel: LandingCustomizationLevel,
): {
  eyebrowKey: LandingProductDetailContentKey;
  includedBodyKey: LandingProductDetailContentKey;
  customizationBodyKey: LandingProductDetailContentKey;
  tagKeys: LandingProductDetailContentKey[];
} {
  const fullyCustomizable = customizationLevel === "fully_customizable";

  return {
    eyebrowKey: kind === "convite" ? "invitationEyebrow" : "saveTheDateEyebrow",
    includedBodyKey:
      kind === "convite" ? "invitationIncludedBody" : "saveTheDateIncludedBody",
    customizationBodyKey: fullyCustomizable
      ? "fullyCustomizableBody"
      : "preDesignedBody",
    tagKeys: fullyCustomizable
      ? kind === "convite"
        ? ["fullyCustomizableTag", "rsvpTag", "mapsTag"]
        : ["fullyCustomizableTag"]
      : ["preDesignedTag"],
  };
}

function normalizedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeLandingDetailImages(value: unknown): string[] | null {
  const images = [...new Set(normalizedStrings(value))];
  return images.length ? images : null;
}

export function resolveLandingDetailImages(input: {
  dedicated: unknown;
  landingImageUrl?: unknown;
}): string[] {
  const candidates = [
    input.landingImageUrl,
    ...(sanitizeLandingDetailImages(input.dedicated) ?? []),
  ];

  return [
    ...new Set(
      candidates
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function appendLandingDetailImage(
  images: readonly string[],
  url: string,
): string[] {
  return sanitizeLandingDetailImages([...images, url]) ?? [];
}

export function removeLandingDetailImage(
  images: readonly string[],
  index: number,
): string[] {
  return images.filter((_, current) => current !== index);
}

export function moveLandingDetailImage(
  images: readonly string[],
  index: number,
  offset: -1 | 1,
): string[] {
  const target = index + offset;
  if (
    index < 0 ||
    index >= images.length ||
    target < 0 ||
    target >= images.length
  ) {
    return [...images];
  }

  const next = [...images];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

import type { LandingCustomizationLevel } from "@/lib/landing-customization";
