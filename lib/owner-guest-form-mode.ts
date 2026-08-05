export type OwnerGuestFormMode = "complete" | "minimal";

export type OwnerGuestFormField =
  | "name"
  | "companion"
  | "phone"
  | "tableLabel"
  | "totalGuests"
  | "canInviteOthers"
  | "note"
  | "customExternalLink";

export const OWNER_GUEST_FORM_MODE_OPTIONS = [
  { value: "complete", label: "Completo" },
  { value: "minimal", label: "Mínimo" },
] as const satisfies ReadonlyArray<{
  value: OwnerGuestFormMode;
  label: string;
}>;

export function normalizeOwnerGuestFormMode(
  value: unknown,
): OwnerGuestFormMode {
  return value === "minimal" ? "minimal" : "complete";
}

export function isOwnerGuestFormFieldVisible(
  mode: OwnerGuestFormMode,
  field: OwnerGuestFormField,
): boolean {
  return mode === "complete" || field === "name" || field === "tableLabel";
}
