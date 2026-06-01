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
 * enabled (hero — implicit via heroImage/videoUrl presence, countdown,
 * scratch reveal, or an end-of-page RSVP form via rsvp.showOnExternalPage).
 * Used by the public renderer to choose between the bare fullscreen-iframe
 * layout and the scrollable rich-sections layout.
 */
export function hasRichExternalSections(invitation: InvitationData): boolean {
  if ((invitation.invitationType ?? "standard") !== "external_link")
    return false;
  const heroOn = Boolean(invitation.heroImage || invitation.videoUrl);
  const countdownOn = Boolean(invitation.countdown?.enabled);
  const scratchOn = Boolean(invitation.scratchReveal?.enabled);
  // Opt a bare external link into the scrollable rich layout when the RSVP
  // form is enabled and configured to render at the end of the page.
  const rsvpAtEndOn = Boolean(
    invitation.rsvp?.enabled && invitation.rsvp?.showOnExternalPage,
  );
  return heroOn || countdownOn || scratchOn || rsvpAtEndOn;
}
