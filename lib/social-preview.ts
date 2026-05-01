import type { InvitationData, InvitationEventType, SocialPreview } from "./types";
import type { SaveTheDateData } from "./save-the-date";
import {
  buildInvitationDisplayName,
  isWeddingEventType,
} from "./invitation-event-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Path to the bundled default OG image (relative to the site origin). */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.jpg";

/** Recommended image dimensions for OG images. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResolvedSocialPreview {
  /** Always an absolute URL. */
  image: string;
  title: string;
  description: string;
  imageSource: "custom" | "hero" | "bottomHero" | "default";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultImageUrl(siteOrigin: string): string {
  return `${siteOrigin}${DEFAULT_OG_IMAGE_PATH}`;
}

function nonEmpty(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function describeInvitationEvent(
  eventType: InvitationEventType,
  isWedding: boolean,
): string {
  if (isWedding) return "Convite de Casamento";
  switch (eventType) {
    case "anniversary":
      return "Convite de Aniversário";
    case "baptism":
      return "Convite de Batizado";
    case "engagement":
      return "Convite de Noivado";
    case "other":
    default:
      return "Convite";
  }
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

/**
 * Resolve the social preview for an invitation, applying the per-type
 * fallback chain. Always returns a fully-populated object.
 */
export function resolveInvitationSocialPreview(
  invitation: InvitationData,
  siteOrigin: string,
): ResolvedSocialPreview {
  const sp: SocialPreview = invitation.socialPreview ?? {};
  const isWedding = isWeddingEventType(invitation.eventType);

  // image
  let image: string;
  let imageSource: ResolvedSocialPreview["imageSource"];
  if (nonEmpty(sp.image)) {
    image = sp.image;
    imageSource = "custom";
  } else if (
    invitation.invitationType !== "external_link" &&
    nonEmpty(invitation.heroImage)
  ) {
    image = invitation.heroImage;
    imageSource = "hero";
  } else {
    image = defaultImageUrl(siteOrigin);
    imageSource = "default";
  }

  // title
  const fallbackTitle = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: invitation.couple.bride,
    secondaryName: invitation.couple.groom,
  });
  const title = nonEmpty(sp.title)
    ? sp.title
    : nonEmpty(fallbackTitle)
      ? fallbackTitle
      : "Convite";

  // description
  const description = nonEmpty(sp.description)
    ? sp.description
    : describeInvitationEvent(invitation.eventType, isWedding);

  return { image, title, description, imageSource };
}

/**
 * Resolve the social preview for a Save the Date, applying the
 * fallback chain. Always returns a fully-populated object.
 */
export function resolveSaveTheDateSocialPreview(
  saveTheDate: SaveTheDateData,
  siteOrigin: string,
): ResolvedSocialPreview {
  const sp: SocialPreview = saveTheDate.socialPreview ?? {};
  const { bride, groom } = saveTheDate.couple;

  // image
  let image: string;
  let imageSource: ResolvedSocialPreview["imageSource"];
  if (nonEmpty(sp.image)) {
    image = sp.image;
    imageSource = "custom";
  } else if (
    saveTheDate.bottomHero?.enabled === true &&
    saveTheDate.bottomHero.mediaType === "image" &&
    nonEmpty(saveTheDate.bottomHero.mediaUrl)
  ) {
    image = saveTheDate.bottomHero.mediaUrl;
    imageSource = "bottomHero";
  } else {
    image = defaultImageUrl(siteOrigin);
    imageSource = "default";
  }

  // title
  const title = nonEmpty(sp.title)
    ? sp.title
    : nonEmpty(bride) || nonEmpty(groom)
      ? `${bride} & ${groom} — Save the Date`
      : "Save the Date";

  // description (matches the existing page-level description previously
  // emitted by app/s/[slug]/page.tsx:24)
  const description = nonEmpty(sp.description)
    ? sp.description
    : `${bride} & ${groom} invite you to save the date: ${saveTheDate.date.display}`;

  return { image, title, description, imageSource };
}
