import { describe, expect, it } from "vitest";

import { isPersonalGuestCardHiddenInPreview } from "@/lib/personal-guest-card";
import type { InvitationData } from "@/lib/types";

type GuestCardInput = Pick<InvitationData, "guest" | "personalGuestCard">;

const REAL_GUEST = {
  token: "abc",
  name: "Ana",
  invitationSlug: "ana-e-rui",
} as NonNullable<InvitationData["guest"]>;

describe("isPersonalGuestCardHiddenInPreview", () => {
  it("hides in a landing preview when the flag is set and there is no real guest", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: { hideInPreview: true },
    };
    expect(isPersonalGuestCardHiddenInPreview(invitation, true)).toBe(true);
  });

  it("shows in a landing preview when the flag is unset", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: {},
    };
    expect(isPersonalGuestCardHiddenInPreview(invitation, true)).toBe(false);
  });

  it("shows in a landing preview when personalGuestCard is absent", () => {
    const invitation: GuestCardInput = { guest: undefined };
    expect(isPersonalGuestCardHiddenInPreview(invitation, true)).toBe(false);
  });

  it("shows outside a landing preview even when the flag is set", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: { hideInPreview: true },
    };
    expect(isPersonalGuestCardHiddenInPreview(invitation, false)).toBe(false);
  });

  it("never hides when a real guest is present, even with the flag set", () => {
    const invitation: GuestCardInput = {
      guest: REAL_GUEST,
      personalGuestCard: { hideInPreview: true },
    };
    expect(isPersonalGuestCardHiddenInPreview(invitation, true)).toBe(false);
  });
});
