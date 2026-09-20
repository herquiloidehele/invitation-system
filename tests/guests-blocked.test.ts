import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Only the DB is mocked: the real lib/guests functions run against it, so the
// by-token route exercises the real getPublicGuestByToken + block guard.
const { invitationFindUnique, guestFindUnique, guestCreate } = vi.hoisted(
  () => ({
    invitationFindUnique: vi.fn(),
    guestFindUnique: vi.fn(),
    guestCreate: vi.fn(),
  }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findUnique: invitationFindUnique },
    guest: { findUnique: guestFindUnique, create: guestCreate },
  },
}));

import { GuestValidationError, selfRegisterGuest } from "@/lib/guests";
import { GET as getGuestByToken } from "@/app/api/guests/by-token/[token]/route";

const BLOCKED_AT = new Date("2026-09-20T10:00:00Z");

beforeEach(() => {
  invitationFindUnique.mockReset();
  guestFindUnique.mockReset();
  guestCreate.mockReset();
});

describe("selfRegisterGuest — blocked invitation", () => {
  it("throws an inviterToken validation error (the route maps it to 403) and creates nothing", async () => {
    guestFindUnique.mockResolvedValue({
      id: "g1",
      token: "inviter",
      canInviteOthers: true,
      invitationSlug: "ana-e-rui",
      invitation: {
        guestManagementEnabled: true,
        blockedAt: BLOCKED_AT,
        blockedReason: null,
      },
    });

    const attempt = selfRegisterGuest({ inviterToken: "inviter", name: "Rui" });

    await expect(attempt).rejects.toBeInstanceOf(GuestValidationError);
    await expect(attempt).rejects.toMatchObject({ field: "inviterToken" });
    expect(guestCreate).not.toHaveBeenCalled();
  });
});

describe("GET /api/guests/by-token — blocked invitation", () => {
  it("answers 403 instead of surfacing the personalization", async () => {
    guestFindUnique.mockResolvedValue({
      token: "g1",
      name: "Ana",
      companion: null,
      tableLabel: null,
      totalGuests: null,
      note: null,
      customExternalLink: null,
      canInviteOthers: false,
      invitationSlug: "ana-e-rui",
    });
    invitationFindUnique.mockResolvedValue({
      guestManagementEnabled: true,
      blockedAt: BLOCKED_AT,
      blockedReason: null,
    });

    const res = await getGuestByToken(
      new NextRequest("http://localhost/api/guests/by-token/g1"),
      { params: Promise.resolve({ token: "g1" }) },
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "invitation_blocked" });
    expect(invitationFindUnique).toHaveBeenCalledWith({
      where: { slug: "ana-e-rui" },
      select: {
        guestManagementEnabled: true,
        blockedAt: true,
        blockedReason: true,
      },
    });
  });
});
