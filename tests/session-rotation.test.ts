import { describe, expect, it } from "vitest";

import { buildRecap, shouldRotateSession } from "@/worker/lib/session-rotation";

describe("shouldRotateSession", () => {
  const base = { limit: 200_000, hardLimit: 600_000 };

  it("never rotates when the size is unknown", () => {
    expect(shouldRotateSession({ contextTokens: null, hasSections: true, ...base })).toBe(false);
  });

  it("keeps resuming below the limit", () => {
    expect(shouldRotateSession({ contextTokens: 120_000, hasSections: true, ...base })).toBe(false);
  });

  it("rotates a large context only when the source is split into sections", () => {
    expect(shouldRotateSession({ contextTokens: 250_000, hasSections: true, ...base })).toBe(true);
    expect(shouldRotateSession({ contextTokens: 250_000, hasSections: false, ...base })).toBe(false);
  });

  it("always rotates past the hard ceiling", () => {
    expect(shouldRotateSession({ contextTokens: 700_000, hasSections: false, ...base })).toBe(true);
  });
});

describe("buildRecap", () => {
  it("keeps the last N turns, newest last, trimmed", () => {
    const msgs = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `turn ${i} ` + "x".repeat(500),
    }));
    const r = buildRecap(msgs, 4);
    expect(r).toContain("turn 9");
    expect(r).not.toContain("turn 5");
    expect(r.length).toBeLessThan(4 * 400 + 200);
  });

  it("is empty with no history", () => {
    expect(buildRecap([], 4)).toBe("");
  });
});
