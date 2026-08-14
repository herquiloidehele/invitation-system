import type {
  InvitationData,
  PersonalGuestCardConfig,
  PersonalGuestCardVisibility,
} from "@/lib/types";

/** Options for the visibility select in the admin invitation forms. */
export const PERSONAL_GUEST_CARD_VISIBILITY_OPTIONS = [
  { value: "always", label: "Sempre visível" },
  { value: "hideInPreview", label: "Ocultar nas pré-visualizações" },
  { value: "never", label: "Nunca mostrar" },
] as const satisfies ReadonlyArray<{
  value: PersonalGuestCardVisibility;
  label: string;
}>;

/**
 * Resolves the effective visibility of the personal guest card.
 *
 * `visibility` wins whenever it is present. Rows written before `visibility`
 * existed only carry the legacy `hideInPreview` boolean, which maps onto
 * `"hideInPreview"`. Anything else is `"always"`.
 */
export function resolvePersonalGuestCardVisibility(
  config: PersonalGuestCardConfig | null | undefined,
): PersonalGuestCardVisibility {
  if (config?.visibility) return config.visibility;
  if (config?.hideInPreview === true) return "hideInPreview";
  return "always";
}

/**
 * Whether the personal guest card should be hidden for this render.
 *
 *  - `never`         — always hidden, including for real guests and in the
 *                      admin live preview.
 *  - `hideInPreview` — hidden only when rendering a landing preview with no
 *                      real per-recipient guest (the card would be the demo
 *                      sample). Real guests and the admin live preview are
 *                      unaffected.
 *  - `always`        — never hidden.
 */
export function isPersonalGuestCardHidden(
  invitation: Pick<InvitationData, "guest" | "personalGuestCard">,
  isLandingPreview: boolean,
): boolean {
  const visibility = resolvePersonalGuestCardVisibility(
    invitation.personalGuestCard,
  );
  if (visibility === "never") return true;
  if (visibility === "hideInPreview") {
    return isLandingPreview === true && !invitation.guest;
  }
  return false;
}
