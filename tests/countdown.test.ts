import { describe, expect, it } from "vitest";

import {
  formatInlineCountdownValues,
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
