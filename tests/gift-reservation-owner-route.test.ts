import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const service = vi.hoisted(() => ({
  listOwnerGiftReservations: vi.fn(),
  releaseOwnerGiftReservation: vi.fn(),
}));

vi.mock("@/lib/gift-reservations", async () => {
  class GiftReservationError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
    }
  }
  const giftReservationErrorStatus = (code: string) =>
    (
      ({ forbidden: 403, not_found: 404, disabled: 422 }) as Record<
        string,
        number
      >
    )[code] ?? 500;
  return { ...service, GiftReservationError, giftReservationErrorStatus };
});

import { GET } from "@/app/api/owner/[token]/gift-reservations/route";
import { DELETE } from "@/app/api/owner/[token]/gift-reservations/[reservationId]/route";
import { GiftReservationError } from "@/lib/gift-reservations";

describe("owner gift reservation routes", () => {
  it("lists reservations for a valid owner token", async () => {
    service.listOwnerGiftReservations.mockResolvedValue([{ id: "r-1" }]);

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ token: "owner" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reservations: [{ id: "r-1" }] });
  });

  it("maps a disabled owner list to 422", async () => {
    service.listOwnerGiftReservations.mockRejectedValue(
      new GiftReservationError("disabled", "Reservations disabled"),
    );

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ token: "owner" }),
    });

    expect(response.status).toBe(422);
  });

  it("does not release a reservation from another invitation", async () => {
    service.releaseOwnerGiftReservation.mockRejectedValue(
      new GiftReservationError("forbidden", "Forbidden"),
    );

    const response = await DELETE(
      new NextRequest("http://localhost", { method: "DELETE" }),
      {
        params: Promise.resolve({
          token: "owner",
          reservationId: "r-other",
        }),
      },
    );

    expect(response.status).toBe(403);
  });
});
