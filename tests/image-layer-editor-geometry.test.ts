import { describe, expect, it } from "vitest";
import {
  type Rect,
  clientToCanvasPct,
  widthPxToPct,
  resizeWidthPct,
  rotationFromPointer,
} from "@/lib/image-layer-editor-geometry";

const canvas: Rect = { left: 0, top: 0, width: 400, height: 1000 };

describe("clientToCanvasPct", () => {
  it("converts a client point to percentages of the canvas", () => {
    const p = clientToCanvasPct(canvas, 200, 500);
    expect(p.xPct).toBe(50);
    expect(p.yPct).toBe(50);
  });

  it("handles a scrolled canvas (negative top) and out-of-box points", () => {
    const scrolled: Rect = { left: 0, top: -600, width: 400, height: 1000 };
    const p = clientToCanvasPct(scrolled, 0, -100);
    expect(p.xPct).toBe(0);
    expect(p.yPct).toBe(50);
  });
});

describe("widthPxToPct", () => {
  it("expresses a pixel width as a percentage of the canvas width", () => {
    expect(widthPxToPct(200, canvas)).toBe(50);
  });
});

describe("resizeWidthPct", () => {
  it("computes width % from the pointer distance to box center", () => {
    expect(resizeWidthPct({ centerX: 200, centerY: 150 }, 300, 150, canvas)).toBe(
      50,
    );
  });

  it("never returns below a 2% floor", () => {
    expect(resizeWidthPct({ centerX: 200, centerY: 150 }, 200, 150, canvas)).toBe(
      2,
    );
  });
});

describe("rotationFromPointer", () => {
  it("is 0deg when the pointer is directly above center", () => {
    expect(rotationFromPointer(200, 150, 200, 50)).toBe(0);
  });
  it("is 90deg when the pointer is directly right of center", () => {
    expect(rotationFromPointer(200, 150, 350, 150)).toBe(90);
  });
});
