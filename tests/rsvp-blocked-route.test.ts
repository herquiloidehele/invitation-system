import { beforeEach, describe, expect, it, vi } from "vitest";

const { invitationFindUnique, rsvpResponseCreate } = vi.hoisted(() => ({
  invitationFindUnique: vi.fn(),
  rsvpResponseCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findUnique: invitationFindUnique },
    rsvpResponse: { create: rsvpResponseCreate },
  },
}));

import { POST } from "@/app/api/rsvp/route";

function postReq(body: unknown) {
  const request = { json: async () => body } as Parameters<typeof POST>[0];
  return POST(request);
}

const validBody = {
  invitationSlug: "party",
  guestName: "Ana",
  attending: true,
};

beforeEach(() => {
  invitationFindUnique.mockReset();
  rsvpResponseCreate.mockReset();
  rsvpResponseCreate.mockResolvedValue({ id: "r1" });
});

describe("POST /api/rsvp — blocked invitation", () => {
  it("answers 403 invitation_blocked and does not persist, even with confirmations open", async () => {
    invitationFindUnique.mockResolvedValue({
      slug: "party",
      rsvp: { acceptingResponses: true },
      blockedAt: new Date("2026-09-20T10:00:00Z"),
      blockedReason: "Pagamento em falta",
    });

    const res = await postReq(validBody);

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: "invitation_blocked",
      success: false,
    });
    expect(rsvpResponseCreate).not.toHaveBeenCalled();
  });

  it("selects the block columns alongside slug and rsvp", async () => {
    invitationFindUnique.mockResolvedValue({
      slug: "party",
      rsvp: {},
      blockedAt: null,
      blockedReason: null,
    });

    await postReq(validBody);

    expect(invitationFindUnique).toHaveBeenCalledWith({
      where: { slug: "party" },
      select: { slug: true, rsvp: true, blockedAt: true, blockedReason: true },
    });
  });

  it("still persists (200) when blockedAt is null", async () => {
    invitationFindUnique.mockResolvedValue({
      slug: "party",
      rsvp: {},
      blockedAt: null,
      blockedReason: null,
    });

    const res = await postReq(validBody);

    expect(res.status).toBe(200);
    expect(rsvpResponseCreate).toHaveBeenCalledTimes(1);
  });
});
