import { describe, expect, it } from "vitest";

import { shouldRenderCurtainHeroVideo } from "../lib/curtain-canva";

describe("shouldRenderCurtainHeroVideo", () => {
  it("renders when a hero video URL is set", () => {
    expect(shouldRenderCurtainHeroVideo("https://cdn.example.com/hero.mp4")).toBe(
      true,
    );
  });

  it("does not render for undefined or null", () => {
    expect(shouldRenderCurtainHeroVideo(undefined)).toBe(false);
    expect(shouldRenderCurtainHeroVideo(null)).toBe(false);
  });

  it("does not render for empty or whitespace-only strings", () => {
    expect(shouldRenderCurtainHeroVideo("")).toBe(false);
    expect(shouldRenderCurtainHeroVideo("   ")).toBe(false);
  });
});
