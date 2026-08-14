import { shouldRenderCoupleGallery } from "./couple-gallery";
import { getEffectiveExternalLink } from "./invitation-external-link";
import { isPersonalGuestCardHidden } from "./personal-guest-card";
import { shouldRenderPlaces } from "./places";
import type { ImageLayerSectionKey, InvitationData } from "./types";

export interface RichExternalImageSectionOptions {
  showRsvp: boolean;
  isLandingPreview?: boolean;
}

/** Section anchors actually present in RichExternalLinkPage's DOM. */
export function getRichExternalInvitationImageSectionKeys(
  invitation: InvitationData,
  { showRsvp, isLandingPreview = false }: RichExternalImageSectionOptions,
): ImageLayerSectionKey[] {
  const keys: ImageLayerSectionKey[] = [];

  if (invitation.heroImage || invitation.videoUrl) keys.push("hero");
  if (invitation.scratchReveal?.enabled) keys.push("scratchReveal");
  if (invitation.countdown?.enabled) keys.push("countdown");
  if (
    (invitation.guestManagementEnabled || isLandingPreview) &&
    !isPersonalGuestCardHidden(invitation, isLandingPreview)
  ) {
    keys.push("personalGuestCard");
  }

  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  if (externalLink) keys.push("canvaDetails");

  if (shouldRenderCoupleGallery(invitation)) keys.push("coupleGallery");
  if (invitation.giftRegistry.enabled) keys.push("giftRegistry");
  if ((invitation.faqs?.length ?? 0) > 0) keys.push("faqs");
  if (shouldRenderPlaces(invitation)) keys.push("places");
  if (showRsvp) keys.push("rsvp");

  return keys;
}

export function isRichExternalImageMigrationReady({
  externalLink,
  measuredExternalLink,
}: {
  externalLink: string;
  measuredExternalLink: string | null;
}): boolean {
  return !externalLink || measuredExternalLink === externalLink;
}
