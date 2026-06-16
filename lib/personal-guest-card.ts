import type { InvitationData } from "@/lib/types";

/**
 * Whether the personal guest card should be hidden in a home-page (landing)
 * preview. True only when:
 *  - we are rendering a landing preview (`isLandingPreview`),
 *  - there is no real per-recipient guest (the card is only the demo sample), and
 *  - the invitation opted in via `personalGuestCard.hideInPreview`.
 *
 * Returns false everywhere else, so the admin live preview and real-guest views
 * are never affected.
 */
export function isPersonalGuestCardHiddenInPreview(
  invitation: Pick<InvitationData, "guest" | "personalGuestCard">,
  isLandingPreview: boolean,
): boolean {
  return (
    isLandingPreview === true &&
    !invitation.guest &&
    invitation.personalGuestCard?.hideInPreview === true
  );
}
