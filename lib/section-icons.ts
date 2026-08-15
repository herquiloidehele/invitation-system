/**
 * Visibility of the decorative icon chip at the top of a section card.
 *
 * Missing configuration deliberately shows the icon so invitations saved before
 * the flag existed keep their current appearance.
 */
export function isSectionIconHidden(
  section: { hideIcon?: boolean } | null | undefined,
): boolean {
  return section?.hideIcon === true;
}
