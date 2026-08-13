import { describe, expect, it } from "vitest";

import { selectCrossSellModels } from "@/lib/landing-product-details";

type Feature = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  description: string | null;
  price: null;
};

function feature(href: string, title: string): Feature {
  return {
    id: href,
    title,
    href,
    imageUrl: `${href}.jpg`,
    description: null,
    price: null,
  };
}

const byCategory = {
  wedding: [
    feature("/modelos/convite/amalfi", "Amalfi"),
    feature("/modelos/convite/dream", "Dream"),
    feature("/modelos/convite/lisboa", "Lisboa"),
    feature("/modelos/convite/porto", "Porto"),
  ],
  save_the_date: [feature("/modelos/save-the-date/golden", "Golden")],
  baptism: [],
  anniversary: [],
  engagement: [],
};

describe("selectCrossSellModels", () => {
  it("returns same-category siblings with the current model excluded", () => {
    const result = selectCrossSellModels(
      byCategory,
      "/modelos/convite/dream",
      6,
    );

    expect(result.map((item) => item.href)).toEqual([
      "/modelos/convite/amalfi",
      "/modelos/convite/lisboa",
      "/modelos/convite/porto",
    ]);
  });

  it("respects the limit", () => {
    const result = selectCrossSellModels(
      byCategory,
      "/modelos/convite/dream",
      2,
    );

    expect(result).toHaveLength(2);
  });

  it("returns an empty list when the category holds only the current model", () => {
    expect(
      selectCrossSellModels(byCategory, "/modelos/save-the-date/golden", 6),
    ).toEqual([]);
  });

  it("returns an empty list when the current model is in no category", () => {
    expect(
      selectCrossSellModels(byCategory, "/modelos/convite/unknown", 6),
    ).toEqual([]);
  });
});
