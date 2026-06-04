import { describe, expect, it } from "vitest";

import {
  DEFAULT_HERO_REVEAL_SECONDS,
  isVideoEntranceLayout,
  resolveHeroRevealSeconds,
  shouldFireVideoEntranceConfetti,
  shouldRevealHeroAtTime,
  shouldShowTapPrompt,
} from "../lib/video-entrance";

describe("isVideoEntranceLayout", () => {
  it("is true only for the video-entrance layout", () => {
    expect(isVideoEntranceLayout({ layout: "video-entrance" })).toBe(true);
    expect(isVideoEntranceLayout({ layout: "curtain-canva" })).toBe(false);
    expect(isVideoEntranceLayout({ layout: "default" })).toBe(false);
    expect(isVideoEntranceLayout({})).toBe(false);
  });
});

describe("resolveHeroRevealSeconds", () => {
  it("passes through valid non-negative numbers", () => {
    expect(resolveHeroRevealSeconds(0)).toBe(0);
    expect(resolveHeroRevealSeconds(6.5)).toBe(6.5);
  });

  it("falls back to the default for unset/invalid/negative values", () => {
    expect(resolveHeroRevealSeconds(undefined)).toBe(DEFAULT_HERO_REVEAL_SECONDS);
    expect(resolveHeroRevealSeconds(null)).toBe(DEFAULT_HERO_REVEAL_SECONDS);
    expect(resolveHeroRevealSeconds(Number.NaN)).toBe(DEFAULT_HERO_REVEAL_SECONDS);
    expect(resolveHeroRevealSeconds(-3)).toBe(DEFAULT_HERO_REVEAL_SECONDS);
    expect(resolveHeroRevealSeconds(Infinity)).toBe(DEFAULT_HERO_REVEAL_SECONDS);
  });
});

describe("shouldRevealHeroAtTime", () => {
  it("is true at or after the threshold", () => {
    expect(shouldRevealHeroAtTime(5, 5)).toBe(true);
    expect(shouldRevealHeroAtTime(6, 5)).toBe(true);
  });

  it("is false before the threshold", () => {
    expect(shouldRevealHeroAtTime(4.9, 5)).toBe(false);
  });

  it("guards non-finite or negative currentTime", () => {
    expect(shouldRevealHeroAtTime(Number.NaN, 5)).toBe(false);
    expect(shouldRevealHeroAtTime(-1, 0)).toBe(false);
  });
});

describe("shouldFireVideoEntranceConfetti", () => {
  it("fires only when explicitly enabled (opt-in, off by default)", () => {
    expect(shouldFireVideoEntranceConfetti({ enabled: true })).toBe(true);
    expect(shouldFireVideoEntranceConfetti({ enabled: false })).toBe(false);
    expect(shouldFireVideoEntranceConfetti(null)).toBe(false);
    expect(shouldFireVideoEntranceConfetti(undefined)).toBe(false);
  });
});

describe("shouldShowTapPrompt", () => {
  it("shows the prompt by default (unset/true)", () => {
    expect(shouldShowTapPrompt(undefined)).toBe(true);
    expect(shouldShowTapPrompt(null)).toBe(true);
    expect(shouldShowTapPrompt(true)).toBe(true);
  });

  it("hides the prompt only when explicitly false", () => {
    expect(shouldShowTapPrompt(false)).toBe(false);
  });
});
