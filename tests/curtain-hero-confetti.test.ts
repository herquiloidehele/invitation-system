import { describe, expect, it } from "vitest";

import { shouldFireHeroConfetti } from "../lib/curtain-canva";

describe("shouldFireHeroConfetti", () => {
  it("fires by default when no config is set (preserves existing behavior)", () => {
    expect(shouldFireHeroConfetti(undefined)).toBe(true);
    expect(shouldFireHeroConfetti(null)).toBe(true);
  });

  it("fires when explicitly enabled", () => {
    expect(shouldFireHeroConfetti({ enabled: true })).toBe(true);
  });

  it("does not fire only when explicitly disabled", () => {
    expect(shouldFireHeroConfetti({ enabled: false })).toBe(false);
  });
});
