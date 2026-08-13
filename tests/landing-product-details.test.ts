import { describe, expect, it } from "vitest";
import {
  appendLandingDetailImage,
  buildLandingProductDetailsPath,
  getLandingProductDetailContentKeys,
  moveLandingDetailImage,
  parseLandingProductKind,
  removeLandingDetailImage,
  resolveLandingDetailImages,
  sanitizeLandingDetailImages,
} from "@/lib/landing-product-details";

describe("landing product details paths", () => {
  it("accepts only the two public product kinds", () => {
    expect(parseLandingProductKind("convite")).toBe("convite");
    expect(parseLandingProductKind("save-the-date")).toBe("save-the-date");
    expect(parseLandingProductKind("invitation")).toBeNull();
  });

  it("builds stable unlocalized detail paths", () => {
    expect(buildLandingProductDetailsPath("convite", "amalfi")).toBe(
      "/modelos/convite/amalfi",
    );
    expect(
      buildLandingProductDetailsPath("save-the-date", "golden-heart"),
    ).toBe("/modelos/save-the-date/golden-heart");
  });
});

describe("landing product detail content", () => {
  it("selects invitation and fully-customizable copy keys", () => {
    expect(
      getLandingProductDetailContentKeys("convite", "fully_customizable"),
    ).toEqual({
      eyebrowKey: "invitationEyebrow",
      includedBodyKey: "invitationIncludedBody",
      customizationBodyKey: "fullyCustomizableBody",
      tagKeys: ["fullyCustomizableTag", "rsvpTag", "mapsTag"],
    });
  });

  it("selects Save the Date and pre-designed copy keys", () => {
    expect(
      getLandingProductDetailContentKeys("save-the-date", "pre_designed"),
    ).toEqual({
      eyebrowKey: "saveTheDateEyebrow",
      includedBodyKey: "saveTheDateIncludedBody",
      customizationBodyKey: "preDesignedBody",
      tagKeys: ["preDesignedTag"],
    });
  });
});

describe("landing detail images", () => {
  it("normalizes persisted JSON into trimmed unique URLs", () => {
    expect(
      sanitizeLandingDetailImages([
        " https://cdn.test/a.jpg ",
        "",
        42,
        "https://cdn.test/a.jpg",
        "https://cdn.test/b.jpg",
      ]),
    ).toEqual(["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"]);
    expect(sanitizeLandingDetailImages({ src: "x" })).toBeNull();
  });

  it("leads with the landing image, then dedicated media, without duplicates", () => {
    expect(
      resolveLandingDetailImages({
        dedicated: ["dedicated-a", "shared", "landing"],
        landingImageUrl: "landing",
      }),
    ).toEqual(["landing", "dedicated-a", "shared"]);
  });

  it("returns one complete image without manufacturing slots", () => {
    expect(
      resolveLandingDetailImages({
        dedicated: null,
        landingImageUrl: "landing-only",
      }),
    ).toEqual(["landing-only"]);
  });

  it("adds, reorders, and removes admin gallery images immutably", () => {
    const original = ["a", "b"];
    expect(appendLandingDetailImage(original, " c ")).toEqual(["a", "b", "c"]);
    expect(moveLandingDetailImage(original, 1, -1)).toEqual(["b", "a"]);
    expect(moveLandingDetailImage(original, 0, -1)).toEqual(original);
    expect(removeLandingDetailImage(original, 0)).toEqual(["b"]);
    expect(original).toEqual(["a", "b"]);
  });
});
