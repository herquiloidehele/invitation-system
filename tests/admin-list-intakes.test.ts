import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  intakeGroupBy: vi.fn(),
  intakeCount: vi.fn(),
  intakeFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    intake: {
      // Stand-in for the Prisma field reference used in the unseen filter.
      fields: { adminViewedAt: "<adminViewedAt ref>" },
      groupBy: db.intakeGroupBy,
      count: db.intakeCount,
      findMany: db.intakeFindMany,
    },
  },
}));

import {
  buildIntakeListWhere,
  loadIntakeListPage,
  parseIntakeListParams,
  unseenIntakeWhere,
} from "@/lib/admin-list/intakes";

const unseenWhere = {
  status: "submitted",
  OR: [
    { adminViewedAt: null },
    { answersUpdatedAt: { gt: "<adminViewedAt ref>" } },
  ],
};

const dbRow = {
  id: "cmabcdefghijklmnopqrk3f9qz",
  productKind: "convite",
  demoName: "Boho Chic",
  source: "self",
  status: "submitted",
  contactName: "Ana",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  answersUpdatedAt: new Date("2026-01-03T10:00:00Z"),
  adminViewedAt: new Date("2026-01-02T10:00:00Z"),
};

type CountArgs = { where?: Record<string, unknown> };

function mockCounts({ unseen }: { unseen: number }) {
  db.intakeCount.mockImplementation(async ({ where = {} }: CountArgs = {}) => {
    if (where.status === "submitted" && "OR" in where) return unseen;
    return 60;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCounts({ unseen: 2 });
  db.intakeFindMany.mockResolvedValue([dbRow]);
  db.intakeGroupBy.mockResolvedValue([
    { status: "submitted", _count: { _all: 9 } },
    { status: "draft", _count: { _all: 4 } },
    { status: "in_production", _count: { _all: 3 } },
    { status: "legacy-status", _count: { _all: 99 } },
  ]);
});

describe("parseIntakeListParams", () => {
  it("leaves the tab open when the URL has none or an unknown one", () => {
    expect(parseIntakeListParams({})).toEqual({ tab: null, q: "", page: 1 });
    expect(parseIntakeListParams({ tab: "nope" }).tab).toBeNull();
  });

  it("reads tab, search and page", () => {
    expect(
      parseIntakeListParams({ tab: "in_production", q: " ana ", page: "2" }),
    ).toEqual({ tab: "in_production", q: "ana", page: 2 });
  });
});

describe("unseenIntakeWhere", () => {
  it("is submitted and never viewed, or edited after the last view", () => {
    expect(unseenIntakeWhere()).toEqual(unseenWhere);
  });
});

describe("buildIntakeListWhere", () => {
  it("uses the unseen filter for the Novos tab", () => {
    expect(buildIntakeListWhere({ tab: "new", q: "" })).toEqual(unseenWhere);
  });

  it("filters the other tabs by status", () => {
    expect(buildIntakeListWhere({ tab: "draft", q: "" })).toEqual({
      status: "draft",
    });
  });

  it("searches client, model and reference across every tab", () => {
    expect(buildIntakeListWhere({ tab: "draft", q: "K3F9QZ" })).toEqual({
      OR: [
        { contactName: { contains: "K3F9QZ", mode: "insensitive" } },
        { demoName: { contains: "K3F9QZ", mode: "insensitive" } },
        { id: { endsWith: "K3F9QZ", mode: "insensitive" } },
      ],
    });
  });

  it("escapes wildcards in the search text", () => {
    const where = buildIntakeListWhere({ tab: "new", q: "100%" });
    expect(where.OR?.[0]).toEqual({
      contactName: { contains: "100\\%", mode: "insensitive" },
    });
  });
});

describe("loadIntakeListPage", () => {
  it("opens Novos by default when something is unseen", async () => {
    const result = await loadIntakeListPage({ tab: null, q: "", page: 1 });

    expect(result.params.tab).toBe("new");
    expect(db.intakeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: unseenWhere,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: 0,
        take: 25,
      }),
    );
  });

  it("opens Submetidos by default when nothing is unseen", async () => {
    mockCounts({ unseen: 0 });
    const result = await loadIntakeListPage({ tab: null, q: "", page: 1 });

    expect(result.params.tab).toBe("submitted");
    expect(db.intakeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "submitted" } }),
    );
  });

  it("keeps the tab named in the URL and pages past the old 500 cap", async () => {
    db.intakeCount.mockResolvedValue(900);
    const result = await loadIntakeListPage({ tab: "archived", q: "", page: 30 });

    expect(result.params).toEqual({ tab: "archived", q: "", page: 30 });
    expect(db.intakeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "archived" }, skip: 725, take: 25 }),
    );
  });

  it("counts every tab, ignoring statuses that have no tab", async () => {
    const result = await loadIntakeListPage({ tab: "draft", q: "", page: 1 });

    expect(result.tabCounts).toEqual({
      new: 2,
      submitted: 9,
      draft: 4,
      in_production: 3,
      archived: 0,
    });
  });

  it("shapes rows for the table", async () => {
    const result = await loadIntakeListPage({ tab: "submitted", q: "", page: 1 });

    expect(result.rows).toEqual([
      {
        id: dbRow.id,
        reference: "K3F9QZ",
        productKind: "convite",
        demoName: "Boho Chic",
        source: "self",
        status: "submitted",
        contactName: "Ana",
        lastActivity: "2026-01-03T10:00:00.000Z",
        unseen: true,
      },
    ]);
  });
});
