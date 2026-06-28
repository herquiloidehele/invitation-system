import { describe, expect, it } from "vitest";

import {
  DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y,
  DEFAULT_HERO_SCROLL_INDICATOR_SIZE,
  heroScrollIndicatorBottom,
  resolveHeroScrollIndicator,
} from "@/lib/hero-scroll-indicator";

describe("resolveHeroScrollIndicator", () => {
  it("defaults: disabled, 24px icon / 48px button, 0 offset", () => {
    const r = resolveHeroScrollIndicator(undefined);
    expect(r.enabled).toBe(false);
    expect(r.iconSize).toBe(DEFAULT_HERO_SCROLL_INDICATOR_SIZE);
    expect(r.iconSize).toBe(24);
    expect(r.buttonSize).toBe(48);
    expect(r.offsetY).toBe(DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y);
    expect(r.offsetY).toBe(0);
  });

  it("enabled resolves from config, honoring defaultEnabled", () => {
    expect(resolveHeroScrollIndicator({ enabled: true }).enabled).toBe(true);
    expect(
      resolveHeroScrollIndicator(undefined, { defaultEnabled: true }).enabled,
    ).toBe(true);
    // explicit false always wins over a true default
    expect(
      resolveHeroScrollIndicator({ enabled: false }, { defaultEnabled: true })
        .enabled,
    ).toBe(false);
  });

  it("uses defaultSize when config.size is unset", () => {
    expect(
      resolveHeroScrollIndicator(undefined, { defaultSize: 28 }).iconSize,
    ).toBe(28);
    expect(
      resolveHeroScrollIndicator(undefined, { defaultSize: 28 }).buttonSize,
    ).toBe(56);
    // explicit size overrides the default
    expect(
      resolveHeroScrollIndicator({ size: 40 }, { defaultSize: 28 }).iconSize,
    ).toBe(40);
  });

  it("clamps size to 16..56", () => {
    expect(resolveHeroScrollIndicator({ size: 4 }).iconSize).toBe(16);
    expect(resolveHeroScrollIndicator({ size: 999 }).iconSize).toBe(56);
  });

  it("clamps offsetY to -84..240", () => {
    expect(resolveHeroScrollIndicator({ offsetY: -999 }).offsetY).toBe(-84);
    expect(resolveHeroScrollIndicator({ offsetY: 9999 }).offsetY).toBe(240);
    expect(resolveHeroScrollIndicator({ offsetY: 100 }).offsetY).toBe(100);
  });
});

describe("heroScrollIndicatorBottom", () => {
  it("composes a safe-area + base + offset calc string", () => {
    expect(heroScrollIndicatorBottom("2rem", 0)).toBe(
      "calc(env(safe-area-inset-bottom) + 2rem + 0px)",
    );
    expect(heroScrollIndicatorBottom("6rem", 40)).toBe(
      "calc(env(safe-area-inset-bottom) + 6rem + 40px)",
    );
    expect(heroScrollIndicatorBottom("2rem", -84)).toBe(
      "calc(env(safe-area-inset-bottom) + 2rem + -84px)",
    );
  });
});
