import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: { invitation: { findUnique }, giftReservation: {}, guest: {} },
}));

import {
  getGiftAvailability,
  giftReservationErrorStatus,
  listOwnerGiftReservations,
} from "@/lib/gift-reservations";

const blockedRow = {
  slug: "ana-e-rui",
  giftRegistry: { enabled: false, text: "" },
  blockedAt: new Date("2026-09-20T10:00:00Z"),
  blockedReason: null,
};

beforeEach(() => findUnique.mockReset());

describe("gift reservations — blocked invitation", () => {
  it("maps the blocked code to 403", () => {
    expect(giftReservationErrorStatus("blocked")).toBe(403);
  });

  it("public availability throws blocked before any registry check", async () => {
    findUnique.mockResolvedValue(blockedRow);

    await expect(
      getGiftAvailability({ slug: "ana-e-rui" }),
    ).rejects.toMatchObject({ code: "blocked" });
  });

  it("owner listing throws blocked before any registry check", async () => {
    findUnique.mockResolvedValue(blockedRow);

    await expect(
      listOwnerGiftReservations("owner-token"),
    ).rejects.toMatchObject({ code: "blocked" });
  });
});
