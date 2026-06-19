import { describe, it, expect, vi, beforeEach } from "vitest";

// Clearing "Nº de convidados" must reach `updateGuest` as `null` so the column
// is set to NULL. This guards the schema plumbing for both editor surfaces:
//   - admin PATCH previously coerced `null` -> 0 (z.coerce.number without
//     .nullable()), silently turning a clear into "0 guests".
//   - owner PATCH is `.strict()` and didn't list totalGuests at all, so it
//     rejected the field with a 400 (the latent host-edit bug).
// Mock the DB + guest helpers so we exercise only the route's parse/forward
// logic (pattern: tests/owner-guests-add-toggle.test.ts).

const { invitationFindUnique, guestFindUnique, updateGuest } = vi.hoisted(
  () => ({
    invitationFindUnique: vi.fn(),
    guestFindUnique: vi.fn(),
    updateGuest: vi.fn(),
  }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findUnique: invitationFindUnique },
    guest: { findUnique: guestFindUnique },
  },
}));

vi.mock("@/lib/guests", () => ({
  updateGuest,
  deleteGuest: vi.fn(),
  GuestValidationError: class GuestValidationError extends Error {
    field?: string;
  },
}));

import { PATCH as adminPatch } from "../app/api/admin/invitations/[id]/guests/[guestId]/route";
import { PATCH as ownerPatch } from "../app/api/owner/[token]/guests/[guestId]/route";

beforeEach(() => {
  invitationFindUnique.mockReset();
  guestFindUnique.mockReset();
  updateGuest.mockReset();
  // Happy-path resolve: the guest belongs to the invitation, management on.
  invitationFindUnique.mockResolvedValue({
    slug: "party",
    guestManagementEnabled: true,
  });
  guestFindUnique.mockResolvedValue({ id: "g1", invitationSlug: "party" });
  updateGuest.mockResolvedValue({ id: "g1" });
});

function adminReq(body: unknown) {
  const request = { json: async () => body } as Parameters<typeof adminPatch>[0];
  return adminPatch(request, {
    params: Promise.resolve({ id: "inv1", guestId: "g1" }),
  });
}

function ownerReq(body: unknown) {
  const request = { json: async () => body } as Parameters<typeof ownerPatch>[0];
  return ownerPatch(request, {
    params: Promise.resolve({ token: "owner-token", guestId: "g1" }),
  });
}

describe("admin PATCH — clearing totalGuests", () => {
  it("accepts totalGuests: null and forwards null (not 0) to updateGuest", async () => {
    const res = await adminReq({ totalGuests: null });
    expect(res.status).toBe(200);
    expect(updateGuest).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ totalGuests: null }),
    );
  });

  it("still accepts a numeric totalGuests", async () => {
    const res = await adminReq({ totalGuests: 5 });
    expect(res.status).toBe(200);
    expect(updateGuest).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ totalGuests: 5 }),
    );
  });
});

describe("owner PATCH — totalGuests (host can now manage it)", () => {
  it("accepts totalGuests: null and forwards null to updateGuest", async () => {
    const res = await ownerReq({ totalGuests: null });
    expect(res.status).toBe(200);
    expect(updateGuest).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ totalGuests: null }),
    );
  });

  it("accepts a numeric totalGuests", async () => {
    const res = await ownerReq({ totalGuests: 4 });
    expect(res.status).toBe(200);
    expect(updateGuest).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ totalGuests: 4 }),
    );
  });

  it("still rejects a negative totalGuests", async () => {
    const res = await ownerReq({ totalGuests: -1 });
    expect(res.status).toBe(400);
  });
});
