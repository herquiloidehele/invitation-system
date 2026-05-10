import { describe, expect, it } from "vitest";
import {
  isCurtainCanvaLayout,
  resolveCurtainVideoSrc,
  shortMonthName,
  resolveCoinColors,
} from "../lib/curtain-canva";

describe("isCurtainCanvaLayout", () => {
  it("returns true only for the 'curtain-canva' layout string", () => {
    expect(isCurtainCanvaLayout({ layout: "curtain-canva" })).toBe(true);
    expect(isCurtainCanvaLayout({ layout: "default" })).toBe(false);
    expect(isCurtainCanvaLayout({ layout: undefined })).toBe(false);
    expect(isCurtainCanvaLayout({})).toBe(false);
  });
});

describe("shortMonthName", () => {
  it("returns the abbreviated month name in pt-PT without the trailing dot", () => {
    expect(shortMonthName("2026-09-14")).toMatch(/^[a-zà-ÿ]{3,5}$/i);
    expect(shortMonthName("2026-09-14")).not.toContain(".");
  });

  it("returns the date.month value when iso is invalid", () => {
    expect(shortMonthName("not-a-date", "Set")).toBe("Set");
  });

  it("returns empty string when iso is invalid and no fallback provided", () => {
    expect(shortMonthName("not-a-date")).toBe("");
  });
});

describe("resolveCoinColors", () => {
  it("uses theme.decorativeColor for the base color when present", () => {
    const colors = resolveCoinColors({ decorativeColor: "#D4AF37" });
    expect(colors.baseColor).toBe("#D4AF37");
    expect(colors.accentColor).toBeTruthy();
  });

  it("falls back to gold defaults when decorativeColor is missing", () => {
    const colors = resolveCoinColors({});
    expect(colors.baseColor).toBe("#C9A961");
    expect(colors.accentColor).toBe("#F4E4A1");
  });
});

describe("resolveCurtainVideoSrc", () => {
  it("uses an uploaded invitation video when provided", () => {
    expect(resolveCurtainVideoSrc("/uploads/custom-curtains.mp4")).toBe(
      "/uploads/custom-curtains.mp4",
    );
  });

  it("falls back to the bundled curtains video when empty", () => {
    expect(resolveCurtainVideoSrc("")).toBe("/videos/curtains.mp4");
    expect(resolveCurtainVideoSrc(undefined)).toBe("/videos/curtains.mp4");
  });
});
