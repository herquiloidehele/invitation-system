import { describe, expect, it } from "vitest";

import {
  DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y,
  DEFAULT_HERO_SCROLL_INDICATOR_SIZE,
  resolveHeroScrollIndicator,
} from "@/lib/hero-scroll-indicator";

describe("resolveHeroScrollIndicator", () => {
  it("uses defaults (24px icon, 48px button, 2rem base) when config is undefined", () => {
    const r = resolveHeroScrollIndicator(undefined, false);
    expect(r.iconSize).toBe(DEFAULT_HERO_SCROLL_INDICATOR_SIZE);
    expect(r.iconSize).toBe(24);
    expect(r.buttonSize).toBe(48);
    expect(r.bottom).toBe("calc(env(safe-area-inset-bottom) + 2rem + 0px)");
  });

  it("uses the 6rem base when audio is enabled", () => {
    const r = resolveHeroScrollIndicator({}, true);
    expect(r.bottom).toBe("calc(env(safe-area-inset-bottom) + 6rem + 0px)");
  });

  it("keeps the button at 2× the icon size", () => {
    const r = resolveHeroScrollIndicator({ size: 40 }, false);
    expect(r.iconSize).toBe(40);
    expect(r.buttonSize).toBe(80);
  });

  it("clamps size to 16..56", () => {
    expect(resolveHeroScrollIndicator({ size: 4 }, false).iconSize).toBe(16);
    expect(resolveHeroScrollIndicator({ size: 999 }, false).iconSize).toBe(56);
  });

  it("applies offsetY to the bottom and clamps it to -24..240", () => {
    expect(resolveHeroScrollIndicator({ offsetY: 100 }, false).bottom).toBe(
      "calc(env(safe-area-inset-bottom) + 2rem + 100px)",
    );
    expect(resolveHeroScrollIndicator({ offsetY: -999 }, false).bottom).toBe(
      "calc(env(safe-area-inset-bottom) + 2rem + -24px)",
    );
    expect(resolveHeroScrollIndicator({ offsetY: 9999 }, false).bottom).toBe(
      "calc(env(safe-area-inset-bottom) + 2rem + 240px)",
    );
  });

  it("falls back to the offset default constant", () => {
    expect(DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y).toBe(0);
  });
});
