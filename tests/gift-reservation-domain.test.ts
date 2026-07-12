import { describe, expect, it } from "vitest";

import {
  giftReservationStorageKey,
  normalizePublicGuestName,
  projectGiftAvailability,
  resolveGiftCardState,
} from "@/lib/gift-reservation-domain";

const items = [
  { id: "gift-1", name: "Taças" },
  { id: "gift-2", name: "Panelas" },
];
const reservations = [
  { id: "r-1", giftItemId: "gift-1", guestName: "Ana" },
];

describe("normalizePublicGuestName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizePublicGuestName("  Ana   Silva ")).toBe("Ana Silva");
  });

  it("rejects an empty name", () => {
    expect(() => normalizePublicGuestName("   ")).toThrow(
      "Guest name is required",
    );
  });

  it("rejects names longer than 120 characters", () => {
    expect(() => normalizePublicGuestName("a".repeat(121))).toThrow(
      "Guest name is too long",
    );
  });
});

describe("projectGiftAvailability", () => {
  it("marks another reservation without leaking identity", () => {
    expect(projectGiftAvailability(items, reservations, null)).toEqual([
      { giftItemId: "gift-1", status: "reserved" },
      { giftItemId: "gift-2", status: "available" },
    ]);
  });

  it("marks only the current identity reservation as owned", () => {
    expect(projectGiftAvailability(items, reservations, "r-1")[0]).toEqual({
      giftItemId: "gift-1",
      status: "owned",
    });
  });
});

describe("gift reservation client helpers", () => {
  it("scopes browser storage to the invitation", () => {
    expect(giftReservationStorageKey("ana-e-rui")).toBe(
      "gift-reservation:ana-e-rui",
    );
  });

  it("maps availability to explicit accessible card states", () => {
    expect(resolveGiftCardState(undefined)).toBe("loading");
    expect(
      resolveGiftCardState({ giftItemId: "1", status: "available" }),
    ).toBe("available");
    expect(
      resolveGiftCardState({ giftItemId: "1", status: "reserved" }),
    ).toBe("reserved");
    expect(
      resolveGiftCardState({ giftItemId: "1", status: "owned" }),
    ).toBe("owned");
  });
});
