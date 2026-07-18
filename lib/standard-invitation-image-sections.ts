import { shouldRenderCoupleGallery } from "./couple-gallery";
import { shouldRenderPlaces } from "./places";
import type { ImageLayerSectionKey, InvitationData } from "./types";

/** Section anchors actually present in the standard invitation DOM. */
export function getStandardInvitationImageSectionKeys(
  invitation: InvitationData,
): ImageLayerSectionKey[] {
  const keys: ImageLayerSectionKey[] = ["hero", "saveTheDate"];

  if (invitation.sectionImages?.image1) keys.push("sectionImage1");
  if (invitation.ourStory?.enabled && invitation.ourStory.description) {
    keys.push("ourStory");
  }
  if (shouldRenderCoupleGallery(invitation)) keys.push("coupleGallery");
  if (invitation.schedule.length > 0) keys.push("schedule");
  if (invitation.sectionImages?.image2) keys.push("sectionImage2");

  keys.push("location");

  if (invitation.sectionImages?.image3) keys.push("sectionImage3");
  if (invitation.dressCode.enabled) keys.push("dressCode");
  if (invitation.giftRegistry.enabled) keys.push("giftRegistry");
  if (
    invitation.guestGuide?.enabled &&
    invitation.guestGuide.items.length > 0
  ) {
    keys.push("guestGuide");
  }
  if ((invitation.faqs?.length ?? 0) > 0) keys.push("faqs");
  if (shouldRenderPlaces(invitation)) keys.push("places");

  keys.push("footer");

  if (invitation.sectionImages?.image4) keys.push("sectionImage4");

  return keys;
}
