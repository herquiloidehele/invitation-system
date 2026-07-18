import type { InvitationData } from "./types";

const DEFAULT_IMAGE_HERO_HEIGHT = 300;

export function getHeroSectionHeight(
  invitation: Pick<InvitationData, "videoUrl" | "heroHeight">,
): "100dvh" | number {
  return invitation.videoUrl
    ? "100dvh"
    : (invitation.heroHeight ?? DEFAULT_IMAGE_HERO_HEIGHT);
}
