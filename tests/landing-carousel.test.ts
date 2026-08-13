import { describe, expect, it } from "vitest";
import {
  getCarouselIndicatorMode,
  getCarouselThumbMetrics,
} from "@/lib/landing-carousel";

describe("getCarouselIndicatorMode", () => {
  it("shows no indicator for an empty or single-slide carousel", () => {
    expect(getCarouselIndicatorMode(0)).toBe("none");
    expect(getCarouselIndicatorMode(1)).toBe("none");
  });

  it("shows dots from two up to eight slides", () => {
    expect(getCarouselIndicatorMode(2)).toBe("dots");
    expect(getCarouselIndicatorMode(5)).toBe("dots");
    expect(getCarouselIndicatorMode(8)).toBe("dots");
  });

  it("switches to the bar past eight slides", () => {
    expect(getCarouselIndicatorMode(9)).toBe("bar");
    expect(getCarouselIndicatorMode(40)).toBe("bar");
  });

  it("treats a non-finite count as no indicator", () => {
    expect(getCarouselIndicatorMode(Number.NaN)).toBe("none");
  });
});

describe("getCarouselThumbMetrics", () => {
  it("sizes the thumb as one slide's share of the track", () => {
    expect(getCarouselThumbMetrics(4, 0)).toEqual({
      widthPercent: 25,
      leftPercent: 0,
    });
  });

  it("moves the thumb across the remaining track as progress advances", () => {
    expect(getCarouselThumbMetrics(4, 0.5)).toEqual({
      widthPercent: 25,
      leftPercent: 37.5,
    });
    expect(getCarouselThumbMetrics(4, 1)).toEqual({
      widthPercent: 25,
      leftPercent: 75,
    });
  });

  it("floors the thumb width so it stays visible on long lists", () => {
    expect(getCarouselThumbMetrics(20, 0).widthPercent).toBe(12);
  });

  it("clamps progress that overshoots during rubber-banding", () => {
    expect(getCarouselThumbMetrics(4, 1.4).leftPercent).toBe(75);
    expect(getCarouselThumbMetrics(4, -0.3).leftPercent).toBe(0);
  });

  it("survives a zero slide count and non-finite progress", () => {
    expect(getCarouselThumbMetrics(0, 0.5)).toEqual({
      widthPercent: 100,
      leftPercent: 0,
    });
    expect(getCarouselThumbMetrics(4, Number.NaN).leftPercent).toBe(0);
  });
});
