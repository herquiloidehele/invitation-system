import { describe, expect, it } from "vitest";

import {
  isOwnerGuestFormFieldVisible,
  normalizeOwnerGuestFormMode,
  OWNER_GUEST_FORM_MODE_OPTIONS,
  type OwnerGuestFormField,
} from "@/lib/owner-guest-form-mode";

const fields: OwnerGuestFormField[] = [
  "name",
  "companion",
  "phone",
  "tableLabel",
  "totalGuests",
  "canInviteOthers",
  "note",
  "customExternalLink",
];

describe("normalizeOwnerGuestFormMode", () => {
  it.each([undefined, null, "", "legacy", 42])(
    "defaults %j to complete",
    (value) => {
      expect(normalizeOwnerGuestFormMode(value)).toBe("complete");
    },
  );

  it.each(["complete", "minimal"] as const)("accepts %s", (value) => {
    expect(normalizeOwnerGuestFormMode(value)).toBe(value);
  });
});

it("provides the two Portuguese admin choices", () => {
  expect(OWNER_GUEST_FORM_MODE_OPTIONS).toEqual([
    { value: "complete", label: "Completo" },
    { value: "minimal", label: "Mínimo" },
  ]);
});

it("shows every field in complete mode", () => {
  expect(
    fields.every((field) => isOwnerGuestFormFieldVisible("complete", field)),
  ).toBe(true);
});

it("shows only name and table in minimal mode", () => {
  expect(
    fields.filter((field) => isOwnerGuestFormFieldVisible("minimal", field)),
  ).toEqual(["name", "tableLabel"]);
});
