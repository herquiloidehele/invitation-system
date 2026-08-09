import { describe, expect, it } from "vitest";

import {
  registerRevealedScratchPart,
  shouldEnablePostScratchRsvp,
  shouldShowInlineRsvp,
} from "@/lib/scratch-rsvp";

describe("shouldEnablePostScratchRsvp", () => {
  it.each([
    [undefined, { enabled: true }, false],
    [{ enabled: true }, { enabled: true }, false],
    [
      { enabled: true, showRsvpButtonAfterReveal: true },
      { enabled: false },
      false,
    ],
    [
      { enabled: true, showRsvpButtonAfterReveal: true },
      { enabled: true },
      true,
    ],
  ])(
    "gates the action from scratch=%j and rsvp=%j",
    (scratchReveal, rsvp, expected) => {
      expect(shouldEnablePostScratchRsvp({ scratchReveal, rsvp })).toBe(
        expected,
      );
    },
  );
});

describe("registerRevealedScratchPart", () => {
  it("completes only after day, month, and year have each revealed", () => {
    const day = registerRevealedScratchPart(new Set(), "day");
    const duplicateDay = registerRevealedScratchPart(day.parts, "day");
    const month = registerRevealedScratchPart(duplicateDay.parts, "month");
    const year = registerRevealedScratchPart(month.parts, "year");

    expect(day.complete).toBe(false);
    expect(duplicateDay.complete).toBe(false);
    expect(month.complete).toBe(false);
    expect(year.complete).toBe(true);
    expect([...year.parts]).toEqual(["day", "month", "year"]);
  });
});

describe("shouldShowInlineRsvp", () => {
  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, true],
    [true, true, false],
  ])(
    "resolves inlineEligible=%s and postScratchRsvpEnabled=%s to %s",
    (inlineEligible, postScratchRsvpEnabled, expected) => {
      expect(
        shouldShowInlineRsvp({ inlineEligible, postScratchRsvpEnabled }),
      ).toBe(expected);
    },
  );
});
