import { normalizeInvitationTranslationIds } from "@/lib/invitation-translations";
import type { InvitationData } from "@/lib/types";

/**
 * Build the JSON body for the admin invitation create/update requests.
 *
 * Optional fields that the form clears by setting `undefined` must be sent as
 * explicit `null`: `JSON.stringify` drops `undefined` keys, and the admin PUT
 * route only writes a column when the key is present in the body, so a dropped
 * key silently keeps the stale value in the database.
 */
export function buildInvitationFormPayload(sourceForm: InvitationData) {
  const normalized = normalizeInvitationTranslationIds(sourceForm);

  return {
    ...normalized,
    translations: normalized.translations ?? null,
    location2: normalized.location2 ?? null,
    customTexts: normalized.customTexts ?? null,
    qrCodeStyle: normalized.qrCodeStyle ?? null,
    ownerSocialPreview: normalized.ownerSocialPreview ?? null,
  };
}
