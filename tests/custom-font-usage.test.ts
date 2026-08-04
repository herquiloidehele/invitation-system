import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  themeFindMany: vi.fn(),
  invitationFindMany: vi.fn(),
  saveTheDateThemeFindMany: vi.fn(),
  saveTheDateFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    theme: { findMany: db.themeFindMany },
    invitation: { findMany: db.invitationFindMany },
    saveTheDateTheme: { findMany: db.saveTheDateThemeFindMany },
    saveTheDate: { findMany: db.saveTheDateFindMany },
  },
}));

import {
  containsCssFamily,
  findCustomFontUsages,
} from "@/lib/custom-fonts/usage";

beforeEach(() => {
  vi.clearAllMocks();
  db.themeFindMany.mockResolvedValue([]);
  db.invitationFindMany.mockResolvedValue([]);
  db.saveTheDateThemeFindMany.mockResolvedValue([]);
  db.saveTheDateFindMany.mockResolvedValue([]);
});

describe("containsCssFamily", () => {
  const cssFamily = "custom-font-family-1";

  it("finds tokens nested in text styles and hero blocks", () => {
    expect(
      containsCssFamily(
        {
          fonts: { display: `'${cssFamily}', serif` },
          blocks: [{ fontFamily: `'${cssFamily}', serif` }],
        },
        cssFamily,
      ),
    ).toBe(true);
  });

  it("does not match a prefix collision", () => {
    expect(
      containsCssFamily(`'${cssFamily}-other', serif`, cssFamily),
    ).toBe(false);
  });

  it("handles nulls, primitive values, and cyclic objects safely", () => {
    const cyclic: Record<string, unknown> = { value: null, count: 2 };
    cyclic.self = cyclic;

    expect(containsCssFamily(cyclic, cssFamily)).toBe(false);
  });
});

describe("findCustomFontUsages", () => {
  it("returns one labeled usage per matching persisted record", async () => {
    db.themeFindMany.mockResolvedValue([
      {
        id: "theme-1",
        name: "rose",
        displayFont: "'custom-font-family-1', serif",
        bodyFont: "'custom-font-family-1', serif",
        scriptFont: null,
        uiFont: "'Inter', sans-serif",
        sectionTitleFont: null,
      },
    ]);
    db.invitationFindMany.mockResolvedValue([
      {
        id: "inv-1",
        slug: "ana-miguel",
        textStyles: null,
        heroTextLayer: {
          blocks: [
            { fontFamily: "'custom-font-family-1', serif" },
          ],
        },
      },
    ]);

    await expect(findCustomFontUsages("custom-font-family-1")).resolves.toEqual(
      [
        { kind: "invitation", id: "inv-1", label: "ana-miguel" },
        { kind: "theme", id: "theme-1", label: "rose" },
      ],
    );
  });
});
