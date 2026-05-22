import type { InvitationType } from "./types";

export function getEffectiveExternalLink(input: {
  invitationType?: InvitationType;
  externalLink?: string;
  guestCustomExternalLink?: string;
}): string {
  const fallback = input.externalLink ?? "";
  if ((input.invitationType ?? "standard") !== "external_link") {
    return fallback;
  }

  const guestLink = input.guestCustomExternalLink?.trim();
  return guestLink || fallback;
}
