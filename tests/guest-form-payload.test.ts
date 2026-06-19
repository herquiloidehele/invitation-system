import { describe, expect, it } from "vitest";

import { buildGuestUpsertInput } from "@/components/admin/guest-form-payload";

// Regression: editing an existing guest and *clearing* an optional text field
// (Canva link, companion, note) must actually remove it. The bug was that the
// form emitted `undefined` for a cleared field, which `JSON.stringify` drops
// from the PATCH body — so `updateGuest`'s `!== undefined` guard skipped it and
// the old value survived. Cleared fields must serialise as "" instead.

// Values for an existing guest whose companion, note and Canva link are all
// being cleared by the host.
function clearedValues() {
  return {
    name: "Maria",
    companion: "",
    phoneCountryCode: "+351",
    phoneNumber: "912345678",
    tableLabel: "Mesa 7",
    totalGuests: "2",
    canInviteOthers: false,
    note: "",
    customExternalLink: "",
  };
}

describe("buildGuestUpsertInput — clearing optional text fields", () => {
  it("emits an empty string (not undefined) when the Canva link is cleared", () => {
    const input = buildGuestUpsertInput(clearedValues(), {
      showCustomExternalLink: true,
    });
    expect(input.customExternalLink).toBe("");
  });

  it("keeps the cleared Canva link in the JSON-serialised PATCH body", () => {
    // The crux of the bug: `undefined` is stripped by JSON.stringify, so the
    // server never sees the field and cannot clear it. "" must survive.
    const input = buildGuestUpsertInput(clearedValues(), {
      showCustomExternalLink: true,
    });
    const body = JSON.parse(JSON.stringify(input));
    expect("customExternalLink" in body).toBe(true);
    expect(body.customExternalLink).toBe("");
  });

  it("emits an empty string when the companion is cleared", () => {
    const input = buildGuestUpsertInput(clearedValues(), {
      showCustomExternalLink: true,
    });
    expect(input.companion).toBe("");
  });

  it("emits an empty string when the note is cleared", () => {
    const input = buildGuestUpsertInput(clearedValues(), {
      showCustomExternalLink: true,
    });
    expect(input.note).toBe("");
  });
});

describe("buildGuestUpsertInput — preserved behaviour", () => {
  it("trims and keeps a provided Canva link", () => {
    const input = buildGuestUpsertInput(
      { ...clearedValues(), customExternalLink: "  https://x.canva.site/m  " },
      { showCustomExternalLink: true },
    );
    expect(input.customExternalLink).toBe("https://x.canva.site/m");
  });

  it("omits customExternalLink entirely when the field is hidden", () => {
    const input = buildGuestUpsertInput(
      { ...clearedValues(), customExternalLink: "https://x.canva.site/m" },
      { showCustomExternalLink: false },
    );
    expect("customExternalLink" in input).toBe(false);
  });
});

describe("buildGuestUpsertInput — clearing Nº de convidados (number field)", () => {
  it("emits null (not undefined) when the total is cleared", () => {
    const input = buildGuestUpsertInput(
      { ...clearedValues(), totalGuests: "" },
      { showCustomExternalLink: true },
    );
    expect(input.totalGuests).toBeNull();
  });

  it("keeps the cleared total in the JSON-serialised body as null", () => {
    // Same root cause as the text fields: `undefined` is dropped by
    // JSON.stringify, so the server can't tell "leave it" from "clear it".
    const input = buildGuestUpsertInput(
      { ...clearedValues(), totalGuests: "" },
      { showCustomExternalLink: true },
    );
    const body = JSON.parse(JSON.stringify(input));
    expect("totalGuests" in body).toBe(true);
    expect(body.totalGuests).toBeNull();
  });

  it("parses a provided total to a number", () => {
    const input = buildGuestUpsertInput(
      { ...clearedValues(), totalGuests: "3" },
      { showCustomExternalLink: true },
    );
    expect(input.totalGuests).toBe(3);
  });
});
