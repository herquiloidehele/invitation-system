import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  invitationFindUnique: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationFindMany: vi.fn(),
  saveTheDateFindFirst: vi.fn(),
  saveTheDateFindMany: vi.fn(),
  rsvpCount: vi.fn(),
  rsvpFindMany: vi.fn(),
  stdRsvpCount: vi.fn(),
  stdRsvpFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: {
      findUnique: db.invitationFindUnique,
      findFirst: db.invitationFindFirst,
      findMany: db.invitationFindMany,
    },
    saveTheDate: {
      findFirst: db.saveTheDateFindFirst,
      findMany: db.saveTheDateFindMany,
    },
    rsvpResponse: { count: db.rsvpCount, findMany: db.rsvpFindMany },
    saveTheDateRsvpResponse: {
      count: db.stdRsvpCount,
      findMany: db.stdRsvpFindMany,
    },
  },
}));

import {
  loadRsvpPage,
  parseRsvpListParams,
  searchRsvpTargets,
} from "@/lib/admin-list/rsvps";

const rsvpEnabled = { rsvp: { path: ["enabled"], equals: true } };
const newestFirst = [{ createdAt: "desc" }, { id: "desc" }];

const invitationRow = {
  id: "inv_1",
  slug: "ana-rui",
  couple: { bride: "Ana", groom: "Rui" },
  guestbook: { enabled: true, hiddenResponseIds: ["r9"] },
  _count: { rsvpResponses: 120 },
};
const newestInvitationRow = {
  ...invitationRow,
  id: "inv_2",
  slug: "newest",
  guestbook: null,
};
const stdRow = {
  slug: "std-ana-rui",
  couple: { bride: "Ana", groom: "Rui" },
  _count: { rsvpResponses: 8 },
};
const response = {
  id: "r1",
  guestName: "Maria",
  email: null,
  attending: true,
  dietaryRestrictions: null,
  message: "Parabéns",
  customAnswers: null,
  submittedAt: new Date("2026-02-01T10:00:00Z"),
};

type CountArgs = { where?: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  db.invitationFindUnique.mockResolvedValue(invitationRow);
  db.invitationFindFirst.mockResolvedValue(newestInvitationRow);
  db.saveTheDateFindFirst.mockResolvedValue(stdRow);
  db.rsvpFindMany.mockResolvedValue([response]);
  db.stdRsvpFindMany.mockResolvedValue([response]);
  // 120 responses, 80 attending.
  db.rsvpCount.mockImplementation(async ({ where = {} }: CountArgs = {}) =>
    where.attending ? 80 : 120,
  );
  // 8 responses, 5 attending.
  db.stdRsvpCount.mockImplementation(async ({ where = {} }: CountArgs = {}) =>
    where.attending ? 5 : 8,
  );
});

describe("parseRsvpListParams", () => {
  it("defaults to the invitations tab with nothing selected", () => {
    expect(parseRsvpListParams({})).toEqual({
      tab: "invitations",
      invitation: null,
      std: null,
      page: 1,
    });
  });

  it("reads tab, selections and page", () => {
    expect(
      parseRsvpListParams({ tab: "std", std: "std-ana-rui", page: "2" }),
    ).toEqual({ tab: "std", invitation: null, std: "std-ana-rui", page: 2 });
  });

  it("treats a selection made only of control characters as none", () => {
    expect(
      parseRsvpListParams({ invitation: "\u0000", std: " \u0000 " }),
    ).toMatchObject({ invitation: null, std: null });
    expect(parseRsvpListParams({ invitation: "ana\u0000-rui" }).invitation).toBe(
      "ana-rui",
    );
  });
});

describe("loadRsvpPage", () => {
  it("loads one page of the selected invitation's responses", async () => {
    const result = await loadRsvpPage({
      tab: "invitations",
      invitation: "ana-rui",
      std: null,
      page: 2,
    });

    expect(db.invitationFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "ana-rui" } }),
    );
    expect(db.invitationFindFirst).not.toHaveBeenCalled();
    expect(db.rsvpFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { invitationSlug: "ana-rui" },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        skip: 50,
        take: 50,
      }),
    );
    expect(result.invitation).toEqual({
      id: "inv_1",
      slug: "ana-rui",
      bride: "Ana",
      groom: "Rui",
      count: 120,
      guestbook: { enabled: true, hiddenResponseIds: ["r9"] },
    });
    expect(result.responses).toEqual([response]);
    expect(result.pagination).toMatchObject({ page: 2, total: 120, pageCount: 3 });
    expect(result.stats).toEqual({ total: 120, attending: 80, declined: 40 });
    expect(result.params).toEqual({ tab: "invitations", page: 2 });
  });

  it("fetches only the badge count for the inactive Save the Date tab", async () => {
    const result = await loadRsvpPage({
      tab: "invitations",
      invitation: "ana-rui",
      std: null,
      page: 1,
    });

    expect(db.saveTheDateFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: rsvpEnabled, orderBy: newestFirst }),
    );
    expect(result.std).toEqual({
      slug: "std-ana-rui",
      bride: "Ana",
      groom: "Rui",
      count: 8,
    });
    expect(result.stdResponseCount).toBe(8);
    expect(db.stdRsvpFindMany).not.toHaveBeenCalled();
  });

  it("falls back to the newest invitation for a missing or unknown slug", async () => {
    const missing = await loadRsvpPage({
      tab: "invitations",
      invitation: null,
      std: null,
      page: 1,
    });
    expect(db.invitationFindUnique).not.toHaveBeenCalled();
    expect(db.invitationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: newestFirst }),
    );
    expect(missing.invitation?.slug).toBe("newest");

    db.invitationFindUnique.mockResolvedValue(null);
    const unknown = await loadRsvpPage({
      tab: "invitations",
      invitation: "deleted",
      std: null,
      page: 1,
    });
    expect(unknown.invitation?.slug).toBe("newest");
    expect(db.rsvpFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { invitationSlug: "newest" } }),
    );
  });

  it("returns an empty page when there are no invitations", async () => {
    db.invitationFindFirst.mockResolvedValue(null);
    const result = await loadRsvpPage({
      tab: "invitations",
      invitation: null,
      std: null,
      page: 3,
    });

    expect(result.invitation).toBeNull();
    expect(result.responses).toEqual([]);
    expect(result.pagination).toMatchObject({ page: 1, total: 0 });
    expect(result.stats).toEqual({ total: 0, attending: 0, declined: 0 });
    expect(db.rsvpFindMany).not.toHaveBeenCalled();
  });

  it("loads the save-the-date tab without touching invitations", async () => {
    const result = await loadRsvpPage({
      tab: "std",
      invitation: null,
      std: "std-ana-rui",
      page: 1,
    });

    expect(db.saveTheDateFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "std-ana-rui", ...rsvpEnabled } }),
    );
    expect(db.stdRsvpFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { saveTheDateSlug: "std-ana-rui" },
        skip: 0,
        take: 50,
      }),
    );
    expect(db.invitationFindUnique).not.toHaveBeenCalled();
    expect(db.invitationFindFirst).not.toHaveBeenCalled();
    expect(db.rsvpFindMany).not.toHaveBeenCalled();
    expect(result.invitation).toBeNull();
    expect(result.stats).toEqual({ total: 8, attending: 5, declined: 3 });
  });

  it("has nothing to show when no save-the-date takes RSVPs", async () => {
    db.saveTheDateFindFirst.mockResolvedValue(null);
    const result = await loadRsvpPage({
      tab: "std",
      invitation: null,
      std: null,
      page: 1,
    });

    expect(result.std).toBeNull();
    expect(result.stdResponseCount).toBe(0);
    expect(result.responses).toEqual([]);
    expect(db.stdRsvpFindMany).not.toHaveBeenCalled();
  });
});

describe("searchRsvpTargets", () => {
  it("lists the newest invitations, filtered by the search text", async () => {
    db.invitationFindMany.mockResolvedValue([invitationRow]);
    const items = await searchRsvpTargets("invitation", "ana");

    const args = db.invitationFindMany.mock.calls[0][0];
    expect(args).toMatchObject({ orderBy: newestFirst, take: 20 });
    expect(args.where.OR).toHaveLength(3);
    expect(items).toEqual([
      { slug: "ana-rui", bride: "Ana", groom: "Rui", count: 120 },
    ]);
  });

  it("lists only save-the-dates with RSVP enabled", async () => {
    db.saveTheDateFindMany.mockResolvedValue([stdRow]);
    await searchRsvpTargets("std", "");

    expect(db.saveTheDateFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: rsvpEnabled, take: 20 }),
    );
  });

  it("copes with a couple that has a missing name", async () => {
    db.invitationFindMany.mockResolvedValue([
      { ...invitationRow, couple: { bride: "Ana" } },
      { ...invitationRow, slug: "no-couple", couple: null },
    ]);
    const items = await searchRsvpTargets("invitation", "");

    expect(items[0]).toMatchObject({ bride: "Ana", groom: "" });
    expect(items[1]).toMatchObject({ bride: "", groom: "" });
  });
});
