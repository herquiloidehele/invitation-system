import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isElegantFloralLayout,
  resolveLocationPhotos,
  wrapCarouselIndex,
  countdownPartsFrom,
  efPageBackgroundStyle,
  EF_BACKGROUND_PATTERN,
  EF_BACKGROUND_TILE_WIDTH,
} from "../lib/elegant-floral";

describe("isElegantFloralLayout", () => {
  it("is true only for the elegant-floral layout", () => {
    expect(isElegantFloralLayout({ layout: "elegant-floral" })).toBe(true);
    expect(isElegantFloralLayout({ layout: "default" })).toBe(false);
    expect(isElegantFloralLayout({ layout: "curtain-canva" })).toBe(false);
    expect(isElegantFloralLayout({})).toBe(false);
  });
});

describe("resolveLocationPhotos", () => {
  it("returns the photos array when present and non-empty", () => {
    const photos = [{ src: "a.jpg" }, { src: "b.jpg" }];
    expect(resolveLocationPhotos({ photos })).toEqual(photos);
  });
  it("falls back to a single-item list from imageUrl", () => {
    expect(resolveLocationPhotos({ imageUrl: "legacy.jpg" })).toEqual([
      { src: "legacy.jpg" },
    ]);
  });
  it("drops blank-src photos and falls back to imageUrl", () => {
    expect(
      resolveLocationPhotos({
        photos: [{ src: "  " }],
        imageUrl: "legacy.jpg",
      }),
    ).toEqual([{ src: "legacy.jpg" }]);
  });
  it("returns [] when nothing is set", () => {
    expect(resolveLocationPhotos({})).toEqual([]);
    expect(resolveLocationPhotos(null)).toEqual([]);
  });
});

describe("wrapCarouselIndex", () => {
  it("wraps within range in both directions", () => {
    expect(wrapCarouselIndex(0, 3)).toBe(0);
    expect(wrapCarouselIndex(3, 3)).toBe(0);
    expect(wrapCarouselIndex(-1, 3)).toBe(2);
    expect(wrapCarouselIndex(4, 3)).toBe(1);
  });
  it("returns 0 for empty length", () => {
    expect(wrapCarouselIndex(2, 0)).toBe(0);
  });
});

describe("countdownPartsFrom", () => {
  it("splits remaining time into parts", () => {
    const now = Date.parse("2026-08-14T16:00:00Z");
    const r = countdownPartsFrom("2026-08-15T16:00:00Z", now);
    expect(r).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: false,
    });
  });
  it("clamps to zero/done once the target has passed", () => {
    const now = Date.parse("2026-08-16T00:00:00Z");
    expect(countdownPartsFrom("2026-08-15T16:00:00Z", now).done).toBe(true);
  });
  it("returns done for an unparseable date", () => {
    expect(countdownPartsFrom("not-a-date", 0).done).toBe(true);
  });
});

describe("efPageBackgroundStyle", () => {
  it("layers the damask tile over the theme's background colour", () => {
    const style = efPageBackgroundStyle({ bg: "#FFFDF7" });
    expect(style.backgroundColor).toBe("#FFFDF7");
    expect(style.backgroundImage).toBe(`url(${EF_BACKGROUND_PATTERN})`);
  });

  it("tiles at a fixed width so the damask keeps one scale on every viewport", () => {
    const style = efPageBackgroundStyle({ bg: "#FFFDF7" });
    expect(style.backgroundRepeat).toBe("repeat");
    expect(style.backgroundSize).toBe(`${EF_BACKGROUND_TILE_WIDTH}px auto`);
  });

  it("points at an asset that actually ships in public/", () => {
    expect(
      existsSync(join(process.cwd(), "public", EF_BACKGROUND_PATTERN)),
    ).toBe(true);
  });
});
