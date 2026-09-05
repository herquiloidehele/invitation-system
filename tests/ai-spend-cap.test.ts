import { describe, expect, it } from "vitest";

import { spendCapExceeded } from "@/worker/lib/spend-cap";

describe("spendCapExceeded", () => {
  it("is false below the cap", () => {
    expect(spendCapExceeded(4.99, 25)).toBe(false);
  });
  it("is true at or over the cap", () => {
    expect(spendCapExceeded(25, 25)).toBe(true);
    expect(spendCapExceeded(30, 25)).toBe(true);
  });
  it("treats a non-positive cap as disabled (never exceeded)", () => {
    expect(spendCapExceeded(1000, 0)).toBe(false);
    expect(spendCapExceeded(1000, -1)).toBe(false);
  });
});
