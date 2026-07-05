import { describe, expect, it } from "vitest";

import {
  groupGalleryByCustomization,
  getPopulatedGalleryCategoryKeys,
} from "@/components/landing/landing-data";
import type { GalleryCategory, GalleryFeature } from "@/lib/landing-features";

function feature(
  id: string,
  category: GalleryCategory,
  customizationLevel: GalleryFeature["customizationLevel"],
): GalleryFeature {
  return {
    id,
    category,
    customizationLevel,
    title: id,
    href: `/${id}`,
    imageUrl: null,
    displayDate: "",
    subtitle: null,
    description: null,
    price: null,
  };
}

describe("landing gallery customization groups", () => {
  it("separates models while retaining their event categories", () => {
    const grouped = groupGalleryByCustomization({
      wedding: [
        feature("custom-wedding", "wedding", "fully_customizable"),
        feature("fixed-wedding", "wedding", "pre_designed"),
      ],
      save_the_date: [
        feature("custom-save-date", "save_the_date", "fully_customizable"),
      ],
      baptism: [],
      anniversary: [],
      engagement: [],
    });

    expect(grouped.fullyCustomizable.wedding.map((item) => item.id)).toEqual([
      "custom-wedding",
    ]);
    expect(
      grouped.fullyCustomizable.save_the_date.map((item) => item.id),
    ).toEqual(["custom-save-date"]);
    expect(grouped.preDesigned.wedding.map((item) => item.id)).toEqual([
      "fixed-wedding",
    ]);
  });

  it("reports populated categories independently for each group", () => {
    const grouped = groupGalleryByCustomization({
      wedding: [feature("custom", "wedding", "fully_customizable")],
      save_the_date: [],
      baptism: [feature("fixed", "baptism", "pre_designed")],
      anniversary: [],
      engagement: [],
    });

    expect(getPopulatedGalleryCategoryKeys(grouped.fullyCustomizable)).toEqual([
      "wedding",
    ]);
    expect(getPopulatedGalleryCategoryKeys(grouped.preDesigned)).toEqual([
      "baptism",
    ]);
  });
});
