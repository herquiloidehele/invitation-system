import { describe, expect, it } from "vitest";
import {
  measureIframeBodyHeight,
  shouldRestoreParentScrollForNavigation,
  shouldResetIframeHeightForNavigation,
} from "../lib/canva-embed-measurement";

describe("measureIframeBodyHeight", () => {
  it("returns the body's content height, ignoring an oversized iframe viewport", () => {
    // Real Canva embed scenario: iframe element is forced to 12000px during
    // off-screen preload, so the iframe document's <html> reports its
    // viewport as 12000. The <body> is the only honest signal — it sizes
    // to the actual content (2196px in the reproduction).
    expect(
      measureIframeBodyHeight({
        bodyScrollHeight: 2196,
        bodyOffsetHeight: 2196,
      }),
    ).toBe(2196);
  });

  it("returns the larger of scrollHeight vs offsetHeight when they disagree", () => {
    expect(
      measureIframeBodyHeight({
        bodyScrollHeight: 5000,
        bodyOffsetHeight: 4800,
      }),
    ).toBe(5000);
  });

  it("returns null when both body metrics are zero (not yet measured)", () => {
    expect(
      measureIframeBodyHeight({ bodyScrollHeight: 0, bodyOffsetHeight: 0 }),
    ).toBeNull();
  });

  it("treats negative or NaN values as 'not yet measured'", () => {
    expect(
      measureIframeBodyHeight({
        bodyScrollHeight: Number.NaN,
        bodyOffsetHeight: -10,
      }),
    ).toBeNull();
  });
});

describe("shouldResetIframeHeightForNavigation", () => {
  it("keeps the measured height during internal Canva navigation", () => {
    expect(
      shouldResetIframeHeightForNavigation({
        currentHeight: 5326,
        isInternalCanvaNavigation: true,
      }),
    ).toBe(false);
  });

  it("resets the measured height when there is no current measurement to preserve", () => {
    expect(
      shouldResetIframeHeightForNavigation({
        currentHeight: null,
        isInternalCanvaNavigation: true,
      }),
    ).toBe(true);
  });
});

describe("shouldRestoreParentScrollForNavigation", () => {
  it("restores parent scroll when internal Canva navigation moves it", () => {
    expect(
      shouldRestoreParentScrollForNavigation({
        beforeScrollY: 3774,
        currentScrollY: 0,
        isInternalCanvaNavigation: true,
      }),
    ).toBe(true);
  });

  it("does not restore when scroll did not change", () => {
    expect(
      shouldRestoreParentScrollForNavigation({
        beforeScrollY: 3774,
        currentScrollY: 3774,
        isInternalCanvaNavigation: true,
      }),
    ).toBe(false);
  });
});
