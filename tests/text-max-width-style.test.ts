import { describe, expect, it } from "vitest";
import {
  applyOverride,
  formatMaxWidthPercent,
  parseMaxWidthPercent,
  resolveTextStyles,
} from "@/lib/text-styles";
import { efStyle } from "@/lib/elegant-floral";
import { resolveTextElementOverride } from "@/lib/curtain-canva";
import type { TemplateTheme } from "@/lib/types";

describe("max-width style overrides", () => {
  it("preserves the template max-width when no override is provided", () => {
    expect(applyOverride({ maxWidth: "85%" })).toEqual({ maxWidth: "85%" });
    expect(applyOverride({ maxWidth: "85%" }, { fontSize: 20 })).toMatchObject({
      maxWidth: "85%",
    });
  });

  it("replaces the template max-width with the override", () => {
    expect(
      applyOverride({ maxWidth: "85%" }, { maxWidth: "100%" }),
    ).toMatchObject({ maxWidth: "100%" });
    expect(applyOverride({ maxWidth: 300 }, { maxWidth: "60%" })).toMatchObject(
      { maxWidth: "60%" },
    );
  });

  it("adds a max-width to a style that had none", () => {
    expect(applyOverride({ color: "red" }, { maxWidth: "70%" })).toEqual({
      color: "red",
      maxWidth: "70%",
    });
  });

  it("reaches the elegant-floral verse through efStyle", () => {
    const textStyles = { elements: { efVerse: { maxWidth: "100%" } } };
    expect(efStyle({ maxWidth: "85%" }, textStyles, "efVerse")).toMatchObject({
      maxWidth: "100%",
    });
    // A sibling key keeps the template cap.
    expect(
      efStyle({ maxWidth: "85%" }, textStyles, "efBlessing"),
    ).toMatchObject({ maxWidth: "85%" });
  });

  it("reaches resolved styles for the standard layout", () => {
    const theme = {
      displayFont: "serif",
      bodyFont: "serif",
      uiFont: "sans-serif",
      textPrimary: "#000",
      textSecondary: "#333",
      textMuted: "#666",
      accent: "#a00",
      primary: "#a00",
    } as unknown as TemplateTheme;
    const ts = resolveTextStyles(theme, {
      elements: { quote: { maxWidth: "95%" } },
    });
    expect(ts.quote.maxWidth).toBe("95%");
    expect(ts.quoteVideo.maxWidth).toBe("95%");
    expect(ts.coupleNames.maxWidth).toBeUndefined();
  });

  it("is valid CSS when an override object is spread straight into a style", () => {
    // Several layouts do `{ maxWidth: "38ch", ...override }`. A bare number
    // there would be read by React as pixels, so the stored value carries
    // its own unit.
    const override = resolveTextElementOverride(
      { elements: { quote: { maxWidth: formatMaxWidthPercent(90) } } },
      "quote",
    );
    expect({ maxWidth: "38ch", ...override }).toEqual({ maxWidth: "90%" });
  });
});

describe("formatMaxWidthPercent", () => {
  it("formats a number as a CSS percentage", () => {
    expect(formatMaxWidthPercent(85)).toBe("85%");
    expect(formatMaxWidthPercent(62.5)).toBe("62.5%");
  });

  it("clamps to the usable range", () => {
    expect(formatMaxWidthPercent(140)).toBe("100%");
    expect(formatMaxWidthPercent(0)).toBe("1%");
    expect(formatMaxWidthPercent(-20)).toBe("1%");
  });

  it("is unset for a missing or non-finite value", () => {
    expect(formatMaxWidthPercent(undefined)).toBeUndefined();
    expect(formatMaxWidthPercent(Number.NaN)).toBeUndefined();
    expect(formatMaxWidthPercent(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});

describe("parseMaxWidthPercent", () => {
  it("reads back a stored percentage", () => {
    expect(parseMaxWidthPercent("85%")).toBe(85);
    expect(parseMaxWidthPercent("62.5%")).toBe(62.5);
  });

  it("round-trips with formatMaxWidthPercent", () => {
    expect(parseMaxWidthPercent(formatMaxWidthPercent(95))).toBe(95);
  });

  it("is unset for anything that is not a percentage", () => {
    expect(parseMaxWidthPercent(undefined)).toBeUndefined();
    expect(parseMaxWidthPercent("")).toBeUndefined();
    expect(parseMaxWidthPercent("300px")).toBeUndefined();
    expect(parseMaxWidthPercent("38ch")).toBeUndefined();
    expect(parseMaxWidthPercent("abc%")).toBeUndefined();
  });
});
