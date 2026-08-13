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
  ],
  save_the_date: [
    feature("/modelos/save-the-date/golden", "Golden"),
    feature("/modelos/save-the-date/silver", "Silver"),
  ],
  baptism: [feature("/modelos/convite/batismo", "Batismo")],
  anniversary: [],
  engagement: [],
};

describe("selectCrossSellModels", () => {
  it("leads with same-category siblings before topping up from other categories", () => {
    const result = selectCrossSellModels(
      byCategory,
      "/modelos/convite/dream",
      6,
    );

    expect(result.map((item) => item.href)).toEqual([
      // same category first, current excluded
      "/modelos/convite/amalfi",
      "/modelos/convite/lisboa",
      // then everything else, in category order
      "/modelos/save-the-date/golden",
      "/modelos/save-the-date/silver",
      "/modelos/convite/batismo",
    ]);
  });

  it("respects the limit", () => {
    expect(
      selectCrossSellModels(byCategory, "/modelos/convite/dream", 2),
    ).toHaveLength(2);
  });

  it("keeps same-category siblings when the limit is tight", () => {
    expect(
      selectCrossSellModels(byCategory, "/modelos/convite/dream", 2).map(
        (item) => item.href,
      ),
    ).toEqual(["/modelos/convite/amalfi", "/modelos/convite/lisboa"]);
  });

  it("still recommends when the current model is alone in its category", () => {
    const result = selectCrossSellModels(
      { ...byCategory, baptism: [feature("/modelos/convite/solo", "Solo")] },
      "/modelos/convite/solo",
      4,
    );

    expect(result.map((item) => item.href)).toEqual([
      "/modelos/convite/amalfi",
      "/modelos/convite/dream",
      "/modelos/convite/lisboa",
      "/modelos/save-the-date/golden",
    ]);
  });

  it("still recommends when the current model is in no category at all", () => {
    const result = selectCrossSellModels(
      byCategory,
      "/modelos/convite/unlisted",
      3,
    );

    expect(result.map((item) => item.href)).toEqual([
      "/modelos/convite/amalfi",
      "/modelos/convite/dream",
      "/modelos/convite/lisboa",
    ]);
  });

  it("never repeats a model that appears in two categories", () => {
    const shared = feature("/modelos/convite/amalfi", "Amalfi");
    const result = selectCrossSellModels(
      { ...byCategory, engagement: [shared] },
      "/modelos/convite/dream",
      9,
    );

    const hrefs = result.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("returns an empty list when the gallery holds nothing else", () => {
    expect(
      selectCrossSellModels(
        { wedding: [feature("/modelos/convite/only", "Only")] },
        "/modelos/convite/only",
        6,
      ),
    ).toEqual([]);
  });
});
