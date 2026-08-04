import { describe, expect, it } from "vitest";

import {
  formatInlineCountdownValues,
  getInlineCountdownSeparatorStyle,
  normalizeExternalCountdownLayout,
  type CountdownTimeLeft,
} from "@/lib/countdown";

describe("formatInlineCountdownValues", () => {
  it("formats all inline countdown values as two digits", () => {
    const timeLeft: CountdownTimeLeft = {
      days: 21,
      hours: 3,
      minutes: 12,
      seconds: 41,
      passed: false,
    };

    expect(formatInlineCountdownValues(timeLeft)).toEqual([
      "21",
      "03",
      "12",
      "41",
    ]);
  });
});

describe("normalizeExternalCountdownLayout", () => {
  it("defaults legacy and unknown layouts to cards", () => {
    expect(normalizeExternalCountdownLayout(undefined)).toBe("cards");
    expect(normalizeExternalCountdownLayout("tiles")).toBe("cards");
  });

  it("preserves the inline layout", () => {
    expect(normalizeExternalCountdownLayout("inline")).toBe("inline");
  });
});

describe("getInlineCountdownSeparatorStyle", () => {
  it("uses a regular readable colon aligned with the number row", () => {
    expect(getInlineCountdownSeparatorStyle("Inter", "#c09020")).toEqual({
      fontFamily: "Inter",
      color: "#c09020",
      fontSize: 32,
      fontWeight: 400,
      lineHeight: 1,
      marginTop: 4,
    });
  });
});
