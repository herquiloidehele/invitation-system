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

  // Malformed shapes are reachable from the DB — the admin API stores
  // `coverVideos` without shape validation. These must never throw; they
  // fall back to the envelope.
  type CoverVideosArg = Parameters<typeof shouldRenderVideoSequenceCover>[0];
  const cv = (v: unknown) => v as unknown as CoverVideosArg;

  it("does not render (and does not throw) when items is missing", () => {
    expect(shouldRenderVideoSequenceCover(cv({ enabled: true }))).toBe(false);
  });

  it("does not render (and does not throw) when items is not an array", () => {
    expect(
      shouldRenderVideoSequenceCover(cv({ enabled: true, items: "x" })),
    ).toBe(false);
  });

  it("does not render when no item has a valid url", () => {
    expect(
      shouldRenderVideoSequenceCover(
        cv({ enabled: true, items: [{}, { url: "" }, null] }),
      ),
    ).toBe(false);
  });

  it("renders when at least one item has a valid url", () => {
    expect(
      shouldRenderVideoSequenceCover(
        cv({ enabled: true, items: [{ url: "" }, { url: "a.mp4" }] }),
      ),
    ).toBe(true);
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
