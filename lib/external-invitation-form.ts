import type { InvitationData, InvitationType } from "./types";

export function shouldShowExternalInvitationAudioControls(
  invitationType: InvitationType,
): boolean {
  return invitationType === "external_link";
}

export function getExternalInvitationPublicHref(
  slug: string | undefined,
): string | null {
  if (!slug) return null;
  return `/${slug}`;
}

export function getExternalInvitationEmbedSrc(externalLink: string): string {
  try {
    const url = new URL(externalLink);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return externalLink;
    }

    const path = url.pathname === "/" ? "" : url.pathname;
    return `/canva-proxy/${url.host}${path}${url.search}`;
  } catch {
    return externalLink;
  }
}

/**
 * Returns true if an external_link invitation has any optional rich section
 * enabled (hero — implicit via heroImage/videoUrl presence, scratch reveal,
 * or inline RSVP). Used by the public renderer to choose between the bare
 * fullscreen-iframe layout and the new scrollable rich-sections layout.
 */
export function hasRichExternalSections(invitation: InvitationData): boolean {
  if ((invitation.invitationType ?? "standard") !== "external_link")
    return false;
  const heroOn = Boolean(invitation.heroImage || invitation.videoUrl);
  const scratchOn = Boolean(invitation.scratchReveal?.enabled);
  const rsvpOn = Boolean(invitation.rsvp?.enabled);
  return heroOn || scratchOn || rsvpOn;
}
