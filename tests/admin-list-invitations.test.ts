import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  themeFindMany: vi.fn(),
  invitationCount: vi.fn(),
  invitationFindMany: vi.fn(),
  rsvpResponseCount: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    theme: { findMany: db.themeFindMany },
    invitation: { count: db.invitationCount, findMany: db.invitationFindMany },
    rsvpResponse: { count: db.rsvpResponseCount },
  },
}));

import {
  buildInvitationListWhere,
  loadInvitationListPage,
  parseInvitationListParams,
} from "@/lib/admin-list/invitations";

const dbRow = {
  id: "inv_1",
  slug: "ana-rui",
  theme: { name: "boho", label: "Boho Chic" },
  couple: { bride: "Ana", groom: "Rui" },
  eventType: "wedding",
  isDemo: false,
  blockedAt: null,
  blockedReason: null,
  date: { display: "1 de Maio" },
  rsvp: { enabled: true },
  renderMode: "standard",
  invitationType: "standard",
  landingModelName: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  _count: { rsvpResponses: 4 },
};

type CountArgs = { where?: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  db.themeFindMany.mockResolvedValue([{ name: "boho", label: "Boho Chic" }]);
  db.rsvpResponseCount.mockResolvedValue(120);
  db.invitationFindMany.mockResolvedValue([dbRow]);
  // 40 real, 5 demo, 7 with RSVP on, 3 matching a search or template filter.
  db.invitationCount.mockImplementation(async ({ where = {} }: CountArgs = {}) => {
    if ("rsvp" in where) return 7;
    if ("OR" in where || "theme" in where) return 3;
    return where.isDemo ? 5 : 40;
  });
});

describe("parseInvitationListParams", () => {
  it("defaults to the first page of the Real tab", () => {
    expect(parseInvitationListParams({})).toEqual({
      tab: "real",
      q: "",
      template: "",
      page: 1,
    });
  });

  it("reads tab, search, template and page", () => {
    expect(
      parseInvitationListParams({
        tab: "demo",
        q: " ana ",
        template: "boho",
        page: "3",
      }),
    ).toEqual({ tab: "demo", q: "ana", template: "boho", page: 3 });
  });

  it("ignores an unknown tab and the 'all' template", () => {
    expect(
      parseInvitationListParams({ tab: "other", template: "all" }),
    ).toMatchObject({ tab: "real", template: "" });
  });
});

describe("buildInvitationListWhere", () => {
  it("filters by tab only when nothing else is set", () => {
    expect(
      buildInvitationListWhere({ tab: "real", q: "", template: "" }),
    ).toEqual({ isDemo: false });
  });

  it("combines tab, template and search", () => {
    const where = buildInvitationListWhere({
      tab: "demo",
      q: "ana",
      template: "boho",
    });
    expect(where).toMatchObject({ isDemo: true, theme: { name: "boho" } });
    expect(where.OR).toHaveLength(3);
  });
});

describe("loadInvitationListPage", () => {
  it("loads one page with tab counts and global stats", async () => {
    const result = await loadInvitationListPage({
      tab: "real",
      q: "",
      template: "",
      page: 2,
    });

    expect(db.invitationFindMany).toHaveBeenCalledTimes(1);
    expect(db.invitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isDemo: false },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 25,
        take: 25,
      }),
    );
    expect(result.pagination).toMatchObject({ page: 2, total: 40, pageCount: 2 });
    expect(result.tabCounts).toEqual({ real: 40, demo: 5 });
    expect(result.stats).toEqual({ total: 45, rsvpEnabled: 7, totalRsvps: 120 });
    expect(result.themes).toEqual([{ name: "boho", label: "Boho Chic" }]);
    expect(result.rows[0]).toMatchObject({
      slug: "ana-rui",
      template: "boho",
      templateLabel: "Boho Chic",
    });
    expect(result.rows[0]).not.toHaveProperty("theme");
  });

  it("keeps tab counts and stats independent of search and template", async () => {
    const result = await loadInvitationListPage({
      tab: "demo",
      q: "ana",
      template: "boho",
      page: 1,
    });

    expect(result.pagination.total).toBe(3);
    expect(result.tabCounts).toEqual({ real: 40, demo: 5 });
    expect(result.stats.total).toBe(45);
  });

  it("drops a template that is not a known theme", async () => {
    const result = await loadInvitationListPage({
      tab: "real",
      q: "",
      template: "deleted-theme",
      page: 1,
    });

    expect(db.invitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDemo: false } }),
    );
    expect(result.params.template).toBe("");
  });

  it("shows the last page when the requested one is past the end", async () => {
    const result = await loadInvitationListPage({
      tab: "real",
      q: "",
      template: "",
      page: 9,
    });

    expect(db.invitationFindMany).toHaveBeenCalledTimes(2);
    expect(db.invitationFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 25, take: 25 }),
    );
    expect(result.params.page).toBe(2);
  });
});
