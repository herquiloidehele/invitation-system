import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const service = vi.hoisted(() => ({
  getGiftAvailability: vi.fn(),
  chooseGift: vi.fn(),
  releaseGuestGift: vi.fn(),
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
    ({ conflict: 409, disabled: 422 } as Record<string, number>)[code] ?? 500;
  return { ...service, GiftReservationError, giftReservationErrorStatus };
});

import {
  DELETE,
  GET,
  POST,
} from "@/app/api/invitations/[slug]/gift-reservations/route";
import { GiftReservationError } from "@/lib/gift-reservations";

const context = { params: Promise.resolve({ slug: "ana-e-rui" }) };
const url =
  "http://localhost/api/invitations/ana-e-rui/gift-reservations";

describe("public gift reservation route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes optional identity headers to availability", async () => {
    service.getGiftAvailability.mockResolvedValue([]);
    const request = new NextRequest(url, {
      headers: {
        "x-guest-token": "guest",
        "x-gift-reservation-token": "public",
      },
    });

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ availability: [] });
    expect(service.getGiftAvailability).toHaveBeenCalledWith({
      slug: "ana-e-rui",
      guestToken: "guest",
      managementToken: "public",
    });
  });

  it("validates POST JSON and forwards the requested gift", async () => {
    service.chooseGift.mockResolvedValue({
      availability: [],
      managementToken: "new-token",
    });
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ giftItemId: "gift-1", guestName: "Ana" }),
    });

    const response = await POST(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      availability: [],
      managementToken: "new-token",
    });
    expect(service.chooseGift).toHaveBeenCalledWith({
      slug: "ana-e-rui",
      giftItemId: "gift-1",
      guestName: "Ana",
      guestToken: undefined,
      managementToken: undefined,
    });
  });

  it("rejects malformed request bodies", async () => {
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ giftItemId: "" }),
    });

    expect((await POST(request, context)).status).toBe(400);
    expect(service.chooseGift).not.toHaveBeenCalled();
  });

  it("maps a concurrent claim to 409", async () => {
    service.chooseGift.mockRejectedValue(
      new GiftReservationError("conflict", "Gift already reserved"),
    );
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ giftItemId: "gift-1", guestName: "Ana" }),
    });

    expect((await POST(request, context)).status).toBe(409);
  });

  it("maps disabled release to 422", async () => {
    service.releaseGuestGift.mockRejectedValue(
      new GiftReservationError("disabled", "Reservations disabled"),
    );
    const request = new NextRequest(url, { method: "DELETE" });

    expect((await DELETE(request, context)).status).toBe(422);
  });
});
