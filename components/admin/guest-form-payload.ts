import type { GuestUpsertInput } from "@/lib/types";

/** Raw values produced by the guest form (text fields are strings). */
export interface GuestFormValues {
  name: string;
  companion?: string;
  phoneCountryCode: string;
  phoneNumber?: string;
  tableLabel?: string;
  totalGuests?: string;
  canInviteOthers: boolean;
  note?: string;
  customExternalLink?: string;
}

/**
 * Build the create/update payload from raw guest-form values.
 *
 * Optional text fields are emitted as trimmed strings — "" when the user
 * cleared them — never `undefined`. Emitting `undefined` would let
 * `JSON.stringify` drop the key from the request body, and the PATCH
 * partial-update logic in `updateGuest` only writes fields that are
 * `!== undefined`, so a cleared field would silently keep its old value.
 * Sending "" lets the server normalise it to NULL and actually remove it.
 */
export function buildGuestUpsertInput(
  values: GuestFormValues,
  options: { showCustomExternalLink: boolean },
): GuestUpsertInput {
  return {
    name: values.name,
    companion: values.companion?.trim() ?? "",
    phoneCountryCode: values.phoneCountryCode,
    phoneNumber: values.phoneNumber?.trim() ?? "",
    tableLabel: values.tableLabel?.trim() ?? "",
    totalGuests:
      values.totalGuests && values.totalGuests.trim() !== ""
        ? Number(values.totalGuests)
        : null,
    canInviteOthers: values.canInviteOthers,
    note: values.note?.trim() ?? "",
    ...(options.showCustomExternalLink
      ? { customExternalLink: values.customExternalLink?.trim() ?? "" }
      : {}),
  };
}
