import { describe, expect, it } from "vitest";

import {
  HERO_MEDIA_FIT_OPTIONS,
  isObjectFit,
  resolveHeroMediaFit,
} from "@/lib/hero-media-fit";

describe("resolveHeroMediaFit", () => {
  it("returns each valid fit unchanged", () => {
    for (const fit of [
      "cover",
      "contain",
      "fill",
      "scale-down",
      "none",
    ] as const) {
      expect(resolveHeroMediaFit(fit)).toBe(fit);
    }
  });

  it("falls back to cover for undefined, null, empty, and unknown values", () => {
    expect(resolveHeroMediaFit(undefined)).toBe("cover");
    expect(resolveHeroMediaFit(null)).toBe("cover");
    expect(resolveHeroMediaFit("")).toBe("cover");
    expect(resolveHeroMediaFit("banana")).toBe("cover");
  });
});

describe("isObjectFit", () => {
  it("accepts only the five valid values", () => {
    expect(isObjectFit("cover")).toBe(true);
    expect(isObjectFit("contain")).toBe(true);
    expect(isObjectFit("scale-down")).toBe(true);
    expect(isObjectFit("nope")).toBe(false);
    expect(isObjectFit(null)).toBe(false);
    expect(isObjectFit(42)).toBe(false);
  });
});

describe("HERO_MEDIA_FIT_OPTIONS", () => {
  it("lists all five fits with cover first", () => {
    expect(HERO_MEDIA_FIT_OPTIONS.map((o) => o.value)).toEqual([
      "cover",
      "contain",
      "fill",
      "scale-down",
      "none",
    ]);
  });
});
