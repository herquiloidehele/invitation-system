import { describe, expect, it } from "vitest";

import {
  filterCustomFontFamilies,
  summarizeCustomFontLibrary,
} from "@/lib/custom-fonts/domain";
import type { AdminCustomFontFamily } from "@/lib/custom-fonts/types";

function family(
  id: string,
  name: string,
  archived: boolean,
  variantCount: number,
): AdminCustomFontFamily {
  return {
    id,
    family: name,
    cssFamily: `custom-font-${id}`,
    category: "display",
    value: `'custom-font-${id}', serif`,
    revision: 1,
    archived,
    variants: Array.from({ length: variantCount }, (_, index) => ({
      id: `${id}-${index}`,
      weight: 400 + index * 100,
      style: "normal",
      format: "woff2",
      revision: 1,
      url: `/fonts/${id}-${index}`,
      originalFileName: `${name}.woff2`,
      mimeType: "font/woff2",
      sizeBytes: 1200,
      checksum: `${id}-${index}`,
      metadata: {},
    })),
  };
}

describe("custom font library view model", () => {
  const families = [
    family("one", "Artemis Display", false, 2),
    family("two", "Boreal Sans", true, 1),
  ];

  it("summarizes active, archived, and variant totals", () => {
    expect(summarizeCustomFontLibrary(families)).toEqual({
      families: 2,
      active: 1,
      archived: 1,
      variants: 3,
    });
  });

  it("filters by normalized name and archive state", () => {
    expect(
      filterCustomFontFamilies(families, {
        search: "  ARTEMIS ",
        archived: "active",
      }).map((item) => item.id),
    ).toEqual(["one"]);
    expect(
      filterCustomFontFamilies(families, {
        search: "",
        archived: "archived",
      }).map((item) => item.id),
    ).toEqual(["two"]);
  });
});
