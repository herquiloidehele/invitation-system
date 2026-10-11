import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  invitationFindMany: vi.fn(),
  saveTheDateFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findMany: db.invitationFindMany },
    saveTheDate: { findMany: db.saveTheDateFindMany },
  },
}));

import { GET } from "@/app/api/admin/rsvp-targets/route";

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/admin/rsvp-targets${query}`));

const row = {
  slug: "ana-rui",
  couple: { bride: "Ana", groom: "Rui" },
  _count: { rsvpResponses: 12 },
};

beforeEach(() => {
  vi.clearAllMocks();
  db.invitationFindMany.mockResolvedValue([row]);
  db.saveTheDateFindMany.mockResolvedValue([row]);
});

describe("GET /api/admin/rsvp-targets", () => {
  it("rejects a missing or unknown kind without querying", async () => {
    for (const query of ["", "?kind=guest"]) {
      const res = await get(query);
      expect(res.status).toBe(400);
    }
    expect(db.invitationFindMany).not.toHaveBeenCalled();
    expect(db.saveTheDateFindMany).not.toHaveBeenCalled();
  });

  it("returns up to 20 invitations matching the search", async () => {
    const res = await get("?kind=invitation&q=ana");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: [{ slug: "ana-rui", bride: "Ana", groom: "Rui", count: 12 }],
    });
    const args = db.invitationFindMany.mock.calls[0][0];
    expect(args.take).toBe(20);
    expect(args.where.OR[0]).toEqual({
      slug: { contains: "ana", mode: "insensitive" },
    });
  });

  it("limits save-the-dates to those with RSVP enabled", async () => {
    await get("?kind=std&q=ana");

    const args = db.saveTheDateFindMany.mock.calls[0][0];
    expect(args.where.rsvp).toEqual({ path: ["enabled"], equals: true });
    expect(args.where.OR).toHaveLength(3);
    expect(args.take).toBe(20);
  });

  it("caps an oversized search text", async () => {
    await get(`?kind=invitation&q=${"a".repeat(300)}`);

    const args = db.invitationFindMany.mock.calls[0][0];
    expect(args.where.OR[0].slug.contains).toHaveLength(100);
  });

  it("answers 500 when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.invitationFindMany.mockRejectedValue(new Error("db down"));

    const res = await get("?kind=invitation");
    expect(res.status).toBe(500);
  });
});
