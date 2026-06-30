import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { POST } from "../app/api/rsvp/route";

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

describe("POST /api/rsvp — confirmations closed", () => {
  it("returns 403 and does not persist when acceptingResponses is false", async () => {
    invitationFindUnique.mockResolvedValue({
      slug: "party",
      rsvp: { acceptingResponses: false },
    });

    const res = await postReq(validBody);

    expect(res.status).toBe(403);
    expect(rsvpResponseCreate).not.toHaveBeenCalled();
  });

  it("persists (200) when acceptingResponses is true", async () => {
    invitationFindUnique.mockResolvedValue({
      slug: "party",
      rsvp: { acceptingResponses: true },
    });

    const res = await postReq(validBody);

    expect(res.status).toBe(200);
    expect(rsvpResponseCreate).toHaveBeenCalledTimes(1);
  });

  it("persists (200) when the flag is missing (default-open)", async () => {
    invitationFindUnique.mockResolvedValue({ slug: "party", rsvp: {} });

    const res = await postReq(validBody);

    expect(res.status).toBe(200);
    expect(rsvpResponseCreate).toHaveBeenCalledTimes(1);
  });
});
