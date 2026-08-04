import { describe, expect, it } from "vitest";

import {
  findSelectedFontCatalogEntry,
  filterFontCatalog,
  mergeFontCatalog,
} from "@/lib/custom-fonts/domain";
import type { FontCatalogEntry } from "@/lib/custom-fonts/types";

const activeCustom: FontCatalogEntry = {
  source: "custom",
  id: "custom-1",
  family: "Atelier",
  category: "display",
  value: "'custom-font-custom-1', serif",
  archived: false,
  variants: [{ weight: 400, style: "normal" }],
};
const archivedCustom: FontCatalogEntry = {
  source: "custom",
  id: "custom-2",
  family: "Legacy Script",
  category: "handwriting",
  value: "'custom-font-custom-2', cursive",
  archived: true,
  variants: [{ weight: 400, style: "normal" }],
};
const googleFont: FontCatalogEntry = {
  source: "google",
  family: "Lato",
  category: "sans-serif",
  value: "'Lato', sans-serif",
  builtin: false,
};

describe("custom font catalog", () => {
  it("shows the archived selection once before active custom and Google fonts", () => {
    const result = mergeFontCatalog({
      custom: [activeCustom],
      google: [googleFont],
      selected: archivedCustom,
    });

    expect(result.map((font) => font.family)).toEqual([
      "Legacy Script",
      "Atelier",
      "Lato",
    ]);
  });

  it("matches a selected custom font by its stable id when its stack changed", () => {
    const archived: FontCatalogEntry = {
      ...archivedCustom,
      id: "archived-one",
      value: "'custom-font-archived-one', serif",
    };

    expect(
      findSelectedFontCatalogEntry(
        [archived],
        "'custom-font-archived-one', sans-serif",
      ),
    ).toBe(archived);
  });

  it("filters by source, category, and normalized search", () => {
    expect(
      filterFontCatalog([activeCustom, googleFont], {
        source: "custom",
        category: "display",
        search: "  ATELIER ",
      }),
    ).toEqual([activeCustom]);
  });
});
