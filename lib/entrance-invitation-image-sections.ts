import { shouldRenderCoupleGallery } from "./couple-gallery";
import { shouldRenderScratchReveal } from "./curtain-canva";
import { getEffectiveExternalLink } from "./invitation-external-link";
import { isPersonalGuestCardHidden } from "./personal-guest-card";
import { shouldRenderPlaces } from "./places";
import type { ImageLayerSectionKey, InvitationData } from "./types";

export interface EntranceImageSectionOptions {
  showInitialPageSections?: boolean;
  isLandingPreview?: boolean;
}

export function isEntranceImageMigrationReady({
  revealed,
  externalLink,
  measuredExternalLink,
}: {
  revealed: boolean;
  externalLink: string;
  measuredExternalLink: string | null;
}): boolean {
  if (!revealed) return false;
  return !externalLink || measuredExternalLink === externalLink;
}

/** Section anchors actually present in the entrance-layout DOM. */
export function getEntranceInvitationImageSectionKeys(
  invitation: InvitationData,
  {
    showInitialPageSections = true,
    isLandingPreview = false,
  }: EntranceImageSectionOptions = {},
): ImageLayerSectionKey[] {
  const keys: ImageLayerSectionKey[] = ["hero"];

  if (showInitialPageSections) {
    if (shouldRenderScratchReveal(invitation.scratchReveal)) {
      keys.push("scratchReveal");
    }
    if (invitation.countdown?.enabled) keys.push("countdown");
    if (
      (invitation.guest || isLandingPreview) &&
      !isPersonalGuestCardHidden(invitation, isLandingPreview)
    ) {
      keys.push("personalGuestCard");
    }
    if (shouldRenderCoupleGallery(invitation)) keys.push("coupleGallery");
  }

  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  if (externalLink) keys.push("canvaDetails");

  if (showInitialPageSections) {
    if (shouldRenderPlaces(invitation)) keys.push("places");
    if (invitation.rsvp.enabled) keys.push("rsvp");
  }

  return keys;
}
