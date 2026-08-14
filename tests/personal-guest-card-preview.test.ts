import { describe, expect, it } from "vitest";

import {
  isPersonalGuestCardHidden,
  resolvePersonalGuestCardVisibility,
} from "@/lib/personal-guest-card";
import type { InvitationData } from "@/lib/types";

type GuestCardInput = Pick<InvitationData, "guest" | "personalGuestCard">;

const REAL_GUEST = {
  token: "abc",
  name: "Ana",
  invitationSlug: "ana-e-rui",
} as NonNullable<InvitationData["guest"]>;

describe("resolvePersonalGuestCardVisibility", () => {
  it("defaults to always when the config is absent", () => {
    expect(resolvePersonalGuestCardVisibility(undefined)).toBe("always");
    expect(resolvePersonalGuestCardVisibility(null)).toBe("always");
  });

  it("defaults to always when the config is empty", () => {
    expect(resolvePersonalGuestCardVisibility({})).toBe("always");
  });

  it("maps a legacy hideInPreview flag onto hideInPreview", () => {
    expect(resolvePersonalGuestCardVisibility({ hideInPreview: true })).toBe(
      "hideInPreview",
    );
  });

  it("maps a legacy hideInPreview: false onto always", () => {
    expect(resolvePersonalGuestCardVisibility({ hideInPreview: false })).toBe(
      "always",
    );
  });

  it("prefers visibility over a conflicting legacy hideInPreview", () => {
    expect(
      resolvePersonalGuestCardVisibility({
        visibility: "always",
        hideInPreview: true,
      }),
    ).toBe("always");
  });

  it("returns never when visibility is never", () => {
    expect(resolvePersonalGuestCardVisibility({ visibility: "never" })).toBe(
      "never",
    );
  });
});

describe("isPersonalGuestCardHidden", () => {
  it("hides in a landing preview when hideInPreview is set and there is no real guest", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: { hideInPreview: true },
    };
    expect(isPersonalGuestCardHidden(invitation, true)).toBe(true);
  });

  it("shows in a landing preview when no flag is set", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: {},
    };
    expect(isPersonalGuestCardHidden(invitation, true)).toBe(false);
  });

  it("shows in a landing preview when personalGuestCard is absent", () => {
    const invitation: GuestCardInput = { guest: undefined };
    expect(isPersonalGuestCardHidden(invitation, true)).toBe(false);
  });

  it("shows outside a landing preview even when hideInPreview is set", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: { hideInPreview: true },
    };
    expect(isPersonalGuestCardHidden(invitation, false)).toBe(false);
  });

  it("never hides for a real guest when only hideInPreview is set", () => {
    const invitation: GuestCardInput = {
      guest: REAL_GUEST,
      personalGuestCard: { hideInPreview: true },
    };
    expect(isPersonalGuestCardHidden(invitation, true)).toBe(false);
  });

  it("hides with visibility never regardless of guest or preview", () => {
    for (const guest of [undefined, REAL_GUEST]) {
      for (const isLandingPreview of [true, false]) {
        const invitation: GuestCardInput = {
          guest,
          personalGuestCard: { visibility: "never" },
        };
        expect(isPersonalGuestCardHidden(invitation, isLandingPreview)).toBe(
          true,
        );
      }
    }
  });

  it("hides with visibility never even when hideInPreview is false", () => {
    const invitation: GuestCardInput = {
      guest: REAL_GUEST,
      personalGuestCard: { visibility: "never", hideInPreview: false },
    };
    expect(isPersonalGuestCardHidden(invitation, false)).toBe(true);
  });

  it("shows everywhere with an explicit visibility of always", () => {
    const invitation: GuestCardInput = {
      guest: undefined,
      personalGuestCard: { visibility: "always", hideInPreview: true },
    };
    expect(isPersonalGuestCardHidden(invitation, true)).toBe(false);
  });
});
