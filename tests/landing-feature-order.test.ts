import { describe, expect, it } from "vitest";

import {
  LANDING_FEATURE_ORDER_BY,
  compareLandingFeatureOrder,
  isSingleReorderGroup,
  moveLandingFeatureId,
  parseReorderIds,
} from "@/lib/landing-feature-order";

function row(id: string, position: number, createdAt: string) {
  return { id, position, createdAt };
}

describe("landing feature ordering", () => {
  it("breaks position ties in the database query", () => {
    expect(LANDING_FEATURE_ORDER_BY).toEqual([
      { position: "asc" },
      { createdAt: "asc" },
      { id: "asc" },
    ]);
  });

  it("orders by position first", () => {
    const rows = [
      row("b", 2, "2026-01-01T00:00:00.000Z"),
      row("a", 1, "2026-02-01T00:00:00.000Z"),
    ];

    expect(rows.sort(compareLandingFeatureOrder).map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("gives tied positions the same order however the rows arrive", () => {
    // Positions as stored in production before the fix: four rows share 7.
    const miguel = row("miguel", 7, "2026-07-18T21:53:45.000Z");
    const jenny = row("jenny", 7, "2026-09-23T11:46:09.000Z");
    const charlot = row("charlot", 7, "2026-08-02T21:54:42.000Z");
    const nathaly = row("nathaly", 7, "2026-08-05T13:24:15.000Z");
    const expected = ["miguel", "charlot", "nathaly", "jenny"];

    const adminArrival = [miguel, jenny, charlot, nathaly];
    const landingArrival = [nathaly, miguel, charlot, jenny];

    expect(adminArrival.sort(compareLandingFeatureOrder).map((r) => r.id)).toEqual(
      expected,
    );
    expect(
      landingArrival.sort(compareLandingFeatureOrder).map((r) => r.id),
    ).toEqual(expected);
  });

  it("falls back to the id when position and creation time match", () => {
    const rows = [
      row("b", 0, "2026-01-01T00:00:00.000Z"),
      row("a", 0, "2026-01-01T00:00:00.000Z"),
    ];

    expect(rows.sort(compareLandingFeatureOrder).map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("compares Date and ISO string creation times alike", () => {
    const rows = [
      { id: "late", position: 0, createdAt: new Date("2026-03-01") },
      { id: "early", position: 0, createdAt: "2026-01-01T00:00:00.000Z" },
    ];

    expect(rows.sort(compareLandingFeatureOrder).map((r) => r.id)).toEqual([
      "early",
      "late",
    ]);
  });
});

describe("moving a landing feature", () => {
  const ids = ["a", "b", "c", "d"];

  it("swaps with the row above", () => {
    expect(moveLandingFeatureId(ids, "c", -1)).toEqual(["a", "c", "b", "d"]);
  });

  it("swaps with the row below", () => {
    expect(moveLandingFeatureId(ids, "b", 1)).toEqual(["a", "c", "b", "d"]);
  });

  it("does not move past either end", () => {
    expect(moveLandingFeatureId(ids, "a", -1)).toBeNull();
    expect(moveLandingFeatureId(ids, "d", 1)).toBeNull();
  });

  it("ignores ids that are not in the list", () => {
    expect(moveLandingFeatureId(ids, "missing", 1)).toBeNull();
  });

  it("leaves the original list untouched", () => {
    moveLandingFeatureId(ids, "c", -1);

    expect(ids).toEqual(["a", "b", "c", "d"]);
  });
});

describe("reorder request", () => {
  it("accepts a list of unique ids", () => {
    expect(parseReorderIds({ ids: ["a", "b"] })).toEqual(["a", "b"]);
  });

  it("rejects anything else", () => {
    expect(parseReorderIds(null)).toBeNull();
    expect(parseReorderIds({})).toBeNull();
    expect(parseReorderIds({ ids: "a" })).toBeNull();
    expect(parseReorderIds({ ids: [] })).toBeNull();
    expect(parseReorderIds({ ids: ["a", 1] })).toBeNull();
    expect(parseReorderIds({ ids: ["a", ""] })).toBeNull();
    expect(parseReorderIds({ ids: ["a", "a"] })).toBeNull();
  });

  it("only reorders rows that are listed together", () => {
    const wedding = { section: "gallery", galleryCategory: "wedding" };

    expect(isSingleReorderGroup([wedding, { ...wedding }])).toBe(true);
    expect(
      isSingleReorderGroup([
        { section: "best_seller", galleryCategory: null },
        { section: "best_seller", galleryCategory: null },
      ]),
    ).toBe(true);
    expect(
      isSingleReorderGroup([
        wedding,
        { section: "gallery", galleryCategory: "baptism" },
      ]),
    ).toBe(false);
    expect(
      isSingleReorderGroup([
        wedding,
        { section: "best_seller", galleryCategory: null },
      ]),
    ).toBe(false);
    expect(isSingleReorderGroup([])).toBe(false);
  });
});
