import { describe, expect, it } from "vitest";

import { nextCoverStep, shouldRenderVideoSequenceCover } from "../lib/cover-videos";

describe("shouldRenderVideoSequenceCover", () => {
  it("renders when enabled with at least one clip", () => {
    expect(
      shouldRenderVideoSequenceCover({
        enabled: true,
        items: [{ url: "https://cdn.example.com/a.mp4" }],
      }),
    ).toBe(true);
  });

  it("does not render when disabled", () => {
    expect(
      shouldRenderVideoSequenceCover({
        enabled: false,
        items: [{ url: "https://cdn.example.com/a.mp4" }],
      }),
    ).toBe(false);
  });

  it("does not render when there are no clips", () => {
    expect(shouldRenderVideoSequenceCover({ enabled: true, items: [] })).toBe(
      false,
    );
  });

  it("does not render for undefined", () => {
    expect(shouldRenderVideoSequenceCover(undefined)).toBe(false);
  });
});

describe("nextCoverStep", () => {
  it("advances to the next clip when more remain", () => {
    expect(nextCoverStep(0, 3)).toEqual({ kind: "play", index: 1 });
    expect(nextCoverStep(1, 3)).toEqual({ kind: "play", index: 2 });
  });

  it("hands off after the last clip", () => {
    expect(nextCoverStep(2, 3)).toEqual({ kind: "handoff" });
  });

  it("hands off immediately for a single-clip sequence", () => {
    expect(nextCoverStep(0, 1)).toEqual({ kind: "handoff" });
  });
});
