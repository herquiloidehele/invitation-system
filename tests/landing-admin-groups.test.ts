import { describe, expect, it } from "vitest";

import {
  filterPickablesForCustomizationLevel,
  groupGalleryFeaturesByCustomizationLevel,
} from "@/lib/landing-admin-groups";

const pickables = [
  { id: "custom", customizationLevel: "fully_customizable" as const },
  { id: "fixed", customizationLevel: "pre_designed" as const },
];

describe("landing admin customization groups", () => {
  it("offers only pickables matching the selected group", () => {
    expect(
      filterPickablesForCustomizationLevel(
        pickables,
        "pre_designed",
        new Set(),
      ).map((item) => item.id),
    ).toEqual(["fixed"]);
  });

  it("excludes models already placed anywhere in the gallery", () => {
    expect(
      filterPickablesForCustomizationLevel(
        pickables,
        "fully_customizable",
        new Set(["custom"]),
      ),
    ).toEqual([]);
  });

  it("groups rows by their source model level with a customizable default", () => {
    const grouped = groupGalleryFeaturesByCustomizationLevel([
      { id: "a", customizationLevel: undefined },
      { id: "b", customizationLevel: "pre_designed" },
    ]);

    expect(grouped.fullyCustomizable.map((item) => item.id)).toEqual(["a"]);
    expect(grouped.preDesigned.map((item) => item.id)).toEqual(["b"]);
  });
});
