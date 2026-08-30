import { describe, expect, it } from "vitest";

import { nextFadeVolume } from "@/lib/ai-audio";

describe("nextFadeVolume", () => {
  it("increments by the step", () => {
    expect(nextFadeVolume(0.03, 0.02, 0.5)).toBeCloseTo(0.05);
  });

  it("never exceeds the target", () => {
    expect(nextFadeVolume(0.49, 0.02, 0.5)).toBe(0.5);
    expect(nextFadeVolume(0.5, 0.02, 0.5)).toBe(0.5);
  });

  it("clamps a negative or zero start up to the step floor", () => {
    expect(nextFadeVolume(0, 0.02, 0.5)).toBeCloseTo(0.02);
  });
});
