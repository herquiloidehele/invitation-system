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

export function appendCanvaProxyDisableScrollFlag(src: string): string {
  if (!src) return src;

  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : src.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);

  params.set("disableScroll", "1");

  return `${path}?${params.toString()}${hash}`;
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
