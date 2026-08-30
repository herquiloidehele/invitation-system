import type { InvitationData } from "./types";

/**
 * Uploaded media, flattened for generated code. The agent composes with these
 * URLs; it never fetches or generates imagery itself.
 */
export interface AiAssetManifest {
  hero: string | null;
  gallery: string[];
  sections: Record<string, string>;
}

/** Everything a generated bundle receives. This is the mount contract. */
export interface AiBundleProps {
  invitation: InvitationData;
  guest: InvitationData["guest"] | null;
  locale: string;
  assets: AiAssetManifest;
  coverOpened: boolean;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Section images are persisted as a loose JSON map. Sort keys so the manifest
 * is stable across renders, and drop anything that isn't a usable URL.
 */
function collectSectionImages(
  sectionImages: InvitationData["sectionImages"],
): Record<string, string> {
  if (!sectionImages || typeof sectionImages !== "object") return {};

  const result: Record<string, string> = {};
  for (const key of Object.keys(sectionImages).sort()) {
    const value = (sectionImages as Record<string, unknown>)[key];
    if (isNonEmptyString(value)) result[key] = value;
  }
  return result;
}

/**
 * Couple gallery images are `{ src, ... }` records. Flatten to the usable
 * `src` URLs and drop any entry without one — malformed persisted JSON must
 * never crash the manifest.
 */
function collectGallery(
  coupleGallery: InvitationData["coupleGallery"],
): string[] {
  const images = coupleGallery?.images;
  if (!Array.isArray(images)) return [];
  return images
    .map((image) => (image as { src?: unknown })?.src)
    .filter(isNonEmptyString);
}

/** Build the props object handed to a generated bundle. Pure. */
export function buildAiBundleProps(args: {
  invitation: InvitationData;
  locale: string;
  coverOpened: boolean;
}): AiBundleProps {
  const { invitation, locale, coverOpened } = args;

  return {
    invitation,
    guest: invitation.guest ?? null,
    locale,
    coverOpened,
    assets: {
      hero: isNonEmptyString(invitation.heroImage) ? invitation.heroImage : null,
      gallery: collectGallery(invitation.coupleGallery),
      sections: collectSectionImages(invitation.sectionImages),
    },
  };
}
