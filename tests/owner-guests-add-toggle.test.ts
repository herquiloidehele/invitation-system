import { describe, it, expect, vi, beforeEach } from "vitest";

// The owner ("host") guest API must honour the per-invitation
// `ownerCanAddGuests` toggle: when off, the host may NOT create guests even by
// hitting the API directly. Mock the DB + guest helpers so we exercise only the
// route's authorization logic (pattern: tests/getInvitation-cache.test.ts).

// `vi.hoisted` so these are initialized before the hoisted `vi.mock` factories
// run (a plain top-level `const` would be in the temporal dead zone).
const { findUnique, createGuest, getGuestsForInvitation } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createGuest: vi.fn(),
  getGuestsForInvitation: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { invitation: { findUnique } },
}));

vi.mock("@/lib/guests", () => ({
  createGuest,
  getGuestsForInvitation,
  // Route references this for `instanceof` error handling.
  GuestValidationError: class GuestValidationError extends Error {
    field?: string;
  },
}));

import { POST } from "../app/api/owner/[token]/guests/route";

const VALID_BODY = {
  name: "Maria",
  phoneCountryCode: "+351",
  phoneNumber: "912345678",
};

function makePost(body: unknown, token = "owner-token") {
  const request = { json: async () => body } as Parameters<typeof POST>[0];
  return POST(request, { params: Promise.resolve({ token }) });
}

beforeEach(() => {
  findUnique.mockReset();
  createGuest.mockReset();
  getGuestsForInvitation.mockReset();
});

describe("owner guests POST — ownerCanAddGuests gate", () => {
  it("rejects with 403 when ownerCanAddGuests is false", async () => {
    findUnique.mockResolvedValue({
      slug: "ana-e-joao",
      guestManagementEnabled: true,
      ownerCanAddGuests: false,
    });

    const res = await makePost(VALID_BODY);

    expect(res.status).toBe(403);
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("allows creation (201) when ownerCanAddGuests is true", async () => {
    findUnique.mockResolvedValue({
      slug: "ana-e-joao",
      guestManagementEnabled: true,
      ownerCanAddGuests: true,
    });
    createGuest.mockResolvedValue({ id: "guest_1", name: "Maria" });

    const res = await makePost(VALID_BODY);

    expect(res.status).toBe(201);
    expect(createGuest).toHaveBeenCalledOnce();
  });

  it("still rejects with 403 when guest management itself is disabled", async () => {
    findUnique.mockResolvedValue({
      slug: "ana-e-joao",
      guestManagementEnabled: false,
      ownerCanAddGuests: true,
    });

    const res = await makePost(VALID_BODY);

    expect(res.status).toBe(403);
    expect(createGuest).not.toHaveBeenCalled();
  });
});
