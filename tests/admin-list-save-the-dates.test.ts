import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  saveTheDateCount: vi.fn(),
  saveTheDateFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    saveTheDate: {
      count: db.saveTheDateCount,
      findMany: db.saveTheDateFindMany,
    },
  },
}));

import {
  buildSaveTheDateListWhere,
  loadSaveTheDateListPage,
  parseSaveTheDateListParams,
} from "@/lib/admin-list/save-the-dates";

const dbRow = {
  id: "std_1",
  slug: "ana-rui",
  couple: { bride: "Ana", groom: "Rui" },
  date: { display: "1 de Maio" },
  rsvp: { enabled: true },
  isDemo: true,
  ownerToken: "owner_1",
  landingModelName: "Coração Dourado",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  theme: { label: "Golden Heart" },
};

type CountArgs = { where?: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  db.saveTheDateFindMany.mockResolvedValue([dbRow]);
  // 30 real, 4 demo, 2 matching a search.
  db.saveTheDateCount.mockImplementation(async ({ where = {} }: CountArgs = {}) => {
    if ("OR" in where) return 2;
    return where.isDemo ? 4 : 30;
  });
});

describe("parseSaveTheDateListParams", () => {
  it("defaults to the first page of the Real tab", () => {
    expect(parseSaveTheDateListParams({})).toEqual({
      tab: "real",
      q: "",
      page: 1,
    });
  });

  it("reads tab, search and page", () => {
    expect(
      parseSaveTheDateListParams({ tab: "demo", q: " ana ", page: "2" }),
    ).toEqual({ tab: "demo", q: "ana", page: 2 });
  });
});

describe("buildSaveTheDateListWhere", () => {
  it("filters by tab, and by couple or slug when searching", () => {
    expect(buildSaveTheDateListWhere({ tab: "real", q: "" })).toEqual({
      isDemo: false,
    });
    const where = buildSaveTheDateListWhere({ tab: "demo", q: "ana" });
    expect(where.isDemo).toBe(true);
    expect(where.OR).toHaveLength(3);
  });
});

describe("loadSaveTheDateListPage", () => {
  it("loads one page with a narrow select and both tab counts", async () => {
    const result = await loadSaveTheDateListPage({ tab: "demo", q: "", page: 1 });

    const args = db.saveTheDateFindMany.mock.calls[0][0];
    expect(args).toMatchObject({
      where: { isDemo: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 25,
    });
    expect(args).not.toHaveProperty("include");
    expect(Object.keys(args.select).sort()).toEqual([
      "couple",
      "createdAt",
      "date",
      "id",
      "isDemo",
      "landingModelName",
      "ownerToken",
      "rsvp",
      "slug",
      "theme",
    ]);
    expect(result.tabCounts).toEqual({ real: 30, demo: 4 });
    expect(result.pagination.total).toBe(4);
    expect(result.rows).toEqual([
      {
        id: "std_1",
        slug: "ana-rui",
        themeName: "Golden Heart",
        couple: { bride: "Ana", groom: "Rui" },
        date: { display: "1 de Maio" },
        createdAt: dbRow.createdAt,
        ownerToken: "owner_1",
        rsvpEnabled: true,
        isDemo: true,
        landingModelName: "Coração Dourado",
      },
    ]);
  });

  it("treats a missing rsvp config as RSVP off", async () => {
    db.saveTheDateFindMany.mockResolvedValue([{ ...dbRow, rsvp: null }]);
    const result = await loadSaveTheDateListPage({ tab: "demo", q: "", page: 1 });
    expect(result.rows[0].rsvpEnabled).toBe(false);
  });

  it("counts search matches without changing the tab counts", async () => {
    const result = await loadSaveTheDateListPage({ tab: "real", q: "ana", page: 1 });
    expect(result.pagination.total).toBe(2);
    expect(result.tabCounts).toEqual({ real: 30, demo: 4 });
  });
});
