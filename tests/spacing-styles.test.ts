import { describe, expect, it } from "vitest";

import {
  getElementSpacing,
  getSectionSpacing,
  sanitizeSpacingStyles,
  setSpacingOverride,
  spacingToStyle,
} from "@/lib/spacing-styles";

describe("spacing styles", () => {
  it("sanitizes finite spacing values and clamps the accepted range", () => {
    expect(
      sanitizeSpacingStyles({
        sections: {
          schedule: { spaceBefore: -120, spaceAfter: 200 },
          location: { spaceBefore: 24, spaceAfter: Number.NaN },
        },
        elements: {
          sectionTitles: { spaceBefore: 12, spaceAfter: 0 },
          bodyText: { spaceBefore: "large", spaceAfter: Infinity },
        },
      }),
    ).toEqual({
      sections: {
        schedule: { spaceBefore: -80, spaceAfter: 160 },
        location: { spaceBefore: 24 },
      },
      elements: {
        sectionTitles: { spaceBefore: 12, spaceAfter: 0 },
      },
    });
  });

  it("drops empty sections, empty elements, and non-string keys", () => {
    const input = {
      sections: {
        schedule: { spaceBefore: undefined, spaceAfter: "bad" },
      },
      elements: {
        title: {},
      },
    };

    expect(sanitizeSpacingStyles(input)).toBeNull();
    expect(sanitizeSpacingStyles(null)).toBeNull();
    expect(sanitizeSpacingStyles("bad")).toBeNull();
  });

  it("resolves section and element spacing by key", () => {
    const spacing = {
      sections: { schedule: { spaceBefore: 16 } },
      elements: { sectionTitles: { spaceAfter: 10 } },
    };

    expect(getSectionSpacing(spacing, "schedule")).toEqual({
      spaceBefore: 16,
    });
    expect(getSectionSpacing(spacing, "missing")).toBeUndefined();
    expect(getElementSpacing(spacing, "sectionTitles")).toEqual({
      spaceAfter: 10,
    });
    expect(getElementSpacing(undefined, "sectionTitles")).toBeUndefined();
  });

  it("converts spacing values to React margin styles", () => {
    expect(spacingToStyle({ spaceBefore: 8, spaceAfter: -4 })).toEqual({
      marginTop: 8,
      marginBottom: -4,
    });
    expect(spacingToStyle({})).toBeUndefined();
    expect(spacingToStyle(undefined)).toBeUndefined();
  });

  it("immutably sets and clears spacing overrides", () => {
    const withValue = setSpacingOverride(
      undefined,
      "elements",
      "sectionTitles",
      "spaceAfter",
      18,
    );

    expect(withValue).toEqual({
      elements: { sectionTitles: { spaceAfter: 18 } },
    });

    expect(
      setSpacingOverride(
        withValue,
        "elements",
        "sectionTitles",
        "spaceAfter",
        undefined,
      ),
    ).toBeUndefined();
  });

  it("keeps missing public spacing style undefined so default classes remain in control", () => {
    expect(
      spacingToStyle(getSectionSpacing(undefined, "schedule")),
    ).toBeUndefined();
    expect(
      spacingToStyle(getElementSpacing(null, "sectionTitles")),
    ).toBeUndefined();
  });
});
