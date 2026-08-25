import { describe, expect, it } from "vitest";
import { buildInvitationFormPayload } from "@/lib/invitation-form-payload";
import { duplicateForm } from "./fixtures/invitation-duplication";

describe("buildInvitationFormPayload", () => {
  it("survives JSON serialization when the second location was removed", () => {
    const form = duplicateForm({ location2: undefined });

    const payload = buildInvitationFormPayload(form);
    const wire = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

    // `undefined` is dropped by JSON.stringify, so the admin PUT route would
    // skip the column and keep the stale second location forever.
    expect("location2" in wire).toBe(true);
    expect(wire.location2).toBeNull();
  });

  it("keeps the second location when one is set", () => {
    const location2 = {
      name: "Quinta do Sol",
      address: "Rua A, 1",
      googleMapsUrl: "https://maps.google.com/?q=quinta",
    };
    const form = duplicateForm({ location2 });

    const payload = buildInvitationFormPayload(form);

    expect(payload.location2).toEqual(location2);
  });

  it("normalizes absent translations to null", () => {
    const payload = buildInvitationFormPayload(
      duplicateForm({ translations: undefined }),
    );

    expect(payload.translations).toBeNull();
  });

  it("survives JSON serialization when all custom texts were cleared", () => {
    const form = duplicateForm({ customTexts: undefined });

    const payload = buildInvitationFormPayload(form);
    const wire = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

    // Clearing the last custom text sets `customTexts` to `undefined`, which
    // JSON.stringify drops, so the admin PUT route would skip the column and
    // keep the stale text forever.
    expect("customTexts" in wire).toBe(true);
    expect(wire.customTexts).toBeNull();
  });

  it("keeps custom texts when they are set", () => {
    const customTexts = { sectionTitle_schedule: "Programa" };
    const payload = buildInvitationFormPayload(duplicateForm({ customTexts }));

    expect(payload.customTexts).toEqual(customTexts);
  });
});
