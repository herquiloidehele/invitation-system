import { describe, expect, it } from "vitest";

import { isAiRenderMode, normalizeRenderMode } from "@/lib/ai-invitation";

describe("normalizeRenderMode", () => {
  it('accepts "ai"', () => {
    expect(normalizeRenderMode("ai")).toBe("ai");
  });

  it('accepts "standard"', () => {
    expect(normalizeRenderMode("standard")).toBe("standard");
  });

  it('falls back to "standard" for unknown, null, or undefined values', () => {
    expect(normalizeRenderMode("nonsense")).toBe("standard");
    expect(normalizeRenderMode(null)).toBe("standard");
    expect(normalizeRenderMode(undefined)).toBe("standard");
    expect(normalizeRenderMode(42)).toBe("standard");
  });
});

describe("isAiRenderMode", () => {
  it("is true only for ai invitations with a bundle url", () => {
    expect(isAiRenderMode({ renderMode: "ai", aiBundleUrl: "/x.js" })).toBe(true);
  });

  it("is false when the bundle url is missing", () => {
    expect(isAiRenderMode({ renderMode: "ai", aiBundleUrl: null })).toBe(false);
  });

  it("is false for standard invitations", () => {
    expect(isAiRenderMode({ renderMode: "standard", aiBundleUrl: "/x.js" })).toBe(
      false,
    );
  });
});
