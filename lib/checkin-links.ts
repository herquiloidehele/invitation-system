/** Pure URL builders for the check-in feature. No React/Prisma. */

function stripTrailingSlashes(origin: string): string {
  return origin.replace(/\/+$/, "");
}

/**
 * The persistent pass page for a non-personalized attendee, e.g.
 * https://x.com/<slug>/pass?c=<checkInToken>. This is also the value encoded
 * into the guest's QR for non-personalized invitations.
 */
export function buildPassUrl(
  origin: string,
  slug: string,
  checkInToken: string,
): string {
  const params = new URLSearchParams();
  params.set("c", checkInToken);
  return `${stripTrailingSlashes(origin)}/${slug}/pass?${params.toString()}`;
}
