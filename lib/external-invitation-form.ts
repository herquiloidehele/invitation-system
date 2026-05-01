import type { InvitationType } from "./types";

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
