import { describe, expect, it } from "vitest";

import {
  buildRsvpFields,
  buildRsvpPayload,
  emptyRsvpValues,
  validateRsvpValues,
} from "@/lib/ai-rsvp";
import type { RsvpValues } from "@/lib/ai-rsvp-types";

function values(overrides: Partial<RsvpValues> = {}): RsvpValues {
  return { ...emptyRsvpValues(), ...overrides };
}

describe("buildRsvpFields", () => {
  it("reflects the show* flags from the rsvp config", () => {
    const fields = buildRsvpFields(
      { enabled: true, showEmail: true, showCompanion: true } as never,
      [],
    );
    expect(fields.email).toBe(true);
    expect(fields.companion).toBe(true);
    expect(fields.numAdults).toBe(false);
  });

  it("carries the custom fields through", () => {
    const custom = [
      { id: "c1", type: "text", label: "Song", required: false, visibility: "always" },
    ];
    const fields = buildRsvpFields({ enabled: true } as never, custom as never);
    expect(fields.custom).toHaveLength(1);
    expect(fields.custom[0].id).toBe("c1");
  });
});

describe("validateRsvpValues", () => {
  const fields = buildRsvpFields(
    { enabled: true, showEmail: true } as never,
    [],
  );

  it("requires a name", () => {
    const { ok, errors } = validateRsvpValues(values({ name: "" }), fields);
    expect(ok).toBe(false);
    expect(errors.name).toBeTruthy();
  });

  it("requires an attendance choice", () => {
    const { ok, errors } = validateRsvpValues(
      values({ name: "Ana", attending: null }),
      fields,
    );
    expect(ok).toBe(false);
    expect(errors.attending).toBeTruthy();
  });

  it("rejects a malformed email when email is shown and provided", () => {
    const { ok, errors } = validateRsvpValues(
      values({ name: "Ana", attending: true, email: "not-an-email" }),
      fields,
    );
    expect(ok).toBe(false);
    expect(errors.email).toBeTruthy();
  });

  it("accepts an empty email even when shown (email is optional)", () => {
    const { ok } = validateRsvpValues(
      values({ name: "Ana", attending: true, email: "" }),
      fields,
    );
    expect(ok).toBe(true);
  });

  it("passes a minimal valid attending submission", () => {
    const { ok, errors } = validateRsvpValues(
      values({ name: "Ana", attending: true }),
      fields,
    );
    expect(ok).toBe(true);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("flags a required custom field left blank when attending", () => {
    const withCustom = buildRsvpFields({ enabled: true } as never, [
      {
        id: "c1",
        type: "text",
        label: "Song",
        required: true,
        visibility: "always",
      },
    ] as never);
    const { ok, errors } = validateRsvpValues(
      values({ name: "Ana", attending: true, custom: { c1: "" } }),
      withCustom,
    );
    expect(ok).toBe(false);
    expect(errors["custom.c1"]).toBeTruthy();
  });
});

describe("buildRsvpPayload", () => {
  it("shapes the POST body and converts attending to a boolean", () => {
    const fields = buildRsvpFields(
      { enabled: true, showEmail: true, showNumAdults: true } as never,
      [],
    );
    const payload = buildRsvpPayload({
      slug: "ana-e-bruno",
      values: values({
        name: "Ana",
        email: "ana@example.com",
        attending: true,
        numAdults: 2,
      }),
      fields,
      guestToken: "tok_1",
    });
    expect(payload.invitationSlug).toBe("ana-e-bruno");
    expect(payload.guestName).toBe("Ana");
    expect(payload.attending).toBe(true);
    expect(payload.email).toBe("ana@example.com");
    expect(payload.numAdults).toBe(2);
    expect(payload.guestToken).toBe("tok_1");
  });

  it("omits hidden fields and empty optionals", () => {
    const fields = buildRsvpFields({ enabled: true } as never, []);
    const payload = buildRsvpPayload({
      slug: "s",
      values: values({ name: "Ana", attending: false, numAdults: 5 }),
      fields,
      guestToken: undefined,
    });
    // numAdults hidden → omitted; email empty → omitted
    expect("numAdults" in payload).toBe(false);
    expect("email" in payload).toBe(false);
    expect(payload.attending).toBe(false);
  });
});
