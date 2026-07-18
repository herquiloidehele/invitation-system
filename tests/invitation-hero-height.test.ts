import { describe, expect, it } from "vitest";

import { getHeroSectionHeight } from "@/lib/hero-section-height";

describe("getHeroSectionHeight", () => {
  it("keeps video heroes full viewport height", () => {
    expect(
      getHeroSectionHeight({ videoUrl: "https://example.com/hero.mp4" }),
    ).toBe("100dvh");
  });

  it("uses the saved image hero height", () => {
    expect(getHeroSectionHeight({ heroHeight: 420 })).toBe(420);
  });

  it("falls back to 300px for existing image invitations", () => {
    expect(getHeroSectionHeight({})).toBe(300);
  });
});
