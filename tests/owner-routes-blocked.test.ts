import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { findUnique, guestFindUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  guestFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findUnique },
    guest: { findUnique: guestFindUnique },
  },
}));

vi.mock("@/lib/guests", () => ({
  createGuest: vi.fn(),
  getGuestsForInvitation: vi.fn(),
  updateGuest: vi.fn(),
  deleteGuest: vi.fn(),
  GuestValidationError: class GuestValidationError extends Error {
    field?: string;
  },
}));

vi.mock("@/lib/checkin-service", () => ({
  getCheckInProgress: vi.fn(),
  resolveSubject: vi.fn(),
  applyCheckIn: vi.fn(),
  undoCheckIn: vi.fn(),
}));

import { GET as ownerGuestsGet } from "@/app/api/owner/[token]/guests/route";
import { PATCH as ownerGuestPatch } from "@/app/api/owner/[token]/guests/[guestId]/route";
import { GET as checkinGet } from "@/app/api/owner/[token]/checkin/route";
import { GET as checkinResolveGet } from "@/app/api/owner/[token]/checkin/resolve/route";
import { POST as checkinScanPost } from "@/app/api/owner/[token]/checkin/scan/route";

const blockedRow = {
  slug: "ana-e-rui",
  guestManagementEnabled: true,
  ownerCanAddGuests: true,
  checkInEnabled: true,
  blockedAt: new Date("2026-09-20T10:00:00Z"),
  blockedReason: "Pagamento em falta",
};

const tokenCtx = { params: Promise.resolve({ token: "owner-token" }) };
const guestCtx = {
  params: Promise.resolve({ token: "owner-token", guestId: "g1" }),
};

function req(
  path: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(`http://localhost${path}`, init);
}

beforeEach(() => {
  findUnique.mockReset();
  guestFindUnique.mockReset();
  findUnique.mockResolvedValue(blockedRow);
  guestFindUnique.mockResolvedValue({ id: "g1", invitationSlug: "ana-e-rui" });
});

describe("owner APIs — blocked invitation answers 403 invitation_blocked", () => {
  const cases: Array<[string, () => Promise<Response>]> = [
    [
      "GET /api/owner/[token]/guests",
      () => ownerGuestsGet(req("/api/owner/owner-token/guests"), tokenCtx),
    ],
    [
      "PATCH /api/owner/[token]/guests/[guestId]",
      () =>
        ownerGuestPatch(
          req("/api/owner/owner-token/guests/g1", {
            method: "PATCH",
            body: JSON.stringify({ name: "Ana" }),
            headers: { "content-type": "application/json" },
          }),
          guestCtx,
        ),
    ],
    [
      "GET /api/owner/[token]/checkin",
      () => checkinGet(req("/api/owner/owner-token/checkin"), tokenCtx),
    ],
    [
      "GET /api/owner/[token]/checkin/resolve",
      () =>
        checkinResolveGet(
          req("/api/owner/owner-token/checkin/resolve?token=abc"),
          tokenCtx,
        ),
    ],
    [
      "POST /api/owner/[token]/checkin/scan",
      () =>
        checkinScanPost(
          req("/api/owner/owner-token/checkin/scan", {
            method: "POST",
            body: JSON.stringify({ token: "abc" }),
            headers: { "content-type": "application/json" },
          }),
          tokenCtx,
        ),
    ],
  ];

  for (const [name, call] of cases) {
    it(name, async () => {
      const res = await call();
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ error: "invitation_blocked" });
    });
  }
});
