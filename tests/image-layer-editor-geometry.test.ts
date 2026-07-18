import { describe, expect, it } from "vitest";
import {
  type ImageAnchorRect,
  type Rect,
  clientToCanvasPct,
  findImageAnchorRect,
  findImageEditorViewport,
  migrateLegacyImageItems,
  percentGeometryFromPixels,
  pixelGeometryFromPercent,
  visibleViewportCenterPct,
  widthPxToPct,
  resizeWidthPct,
  rotationFromPointer,
} from "@/lib/image-layer-editor-geometry";
import type { ImageItem } from "@/lib/types";

const canvas: Rect = { left: 0, top: 0, width: 400, height: 1000 };
const sections: ImageAnchorRect[] = [
  { sectionKey: "schedule", left: 100, top: 200, width: 400, height: 300 },
  { sectionKey: "dressCode", left: 100, top: 600, width: 400, height: 200 },
];

describe("findImageAnchorRect", () => {
  it("selects the section containing the image centre", () => {
    expect(findImageAnchorRect(sections, 650)?.sectionKey).toBe("dressCode");
  });

  it("selects the nearest section when the centre is between sections", () => {
    expect(findImageAnchorRect(sections, 560)?.sectionKey).toBe("dressCode");
  });

  it("selects the nearest edge when the centre is outside all sections", () => {
    expect(findImageAnchorRect(sections, 50)?.sectionKey).toBe("schedule");
    expect(findImageAnchorRect(sections, 1000)?.sectionKey).toBe("dressCode");
  });

  it("returns null when no sections are measurable", () => {
    expect(findImageAnchorRect([], 650)).toBeNull();
  });
});

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

describe("findImageEditorViewport", () => {
  it("uses the scrolling preview ancestor instead of the height-limited content root", () => {
    type Node = {
      overflow: string;
      parentElement: Node | null;
    };
    const page: Node = { overflow: "visible", parentElement: null };
    const scrollViewport: Node = { overflow: "auto", parentElement: page };
    const previewRoot: Node = {
      overflow: "visible",
      parentElement: scrollViewport,
    };

    expect(
      findImageEditorViewport(previewRoot, (element) => element.overflow),
    ).toBe(scrollViewport);
  });

  it("uses the preview root when it is itself the scrolling viewport", () => {
    type Node = {
      overflow: string;
      parentElement: Node | null;
    };
    const previewRoot: Node = { overflow: "auto", parentElement: null };

    expect(
      findImageEditorViewport(previewRoot, (element) => element.overflow),
    ).toBe(previewRoot);
  });
});

describe("visibleViewportCenterPct", () => {
  it("places a new image in the center of the currently visible scrolled section", () => {
    const scrolledCanvas: Rect = {
      left: 100,
      top: -1900,
      width: 400,
      height: 4000,
    };
    const viewport: Rect = {
      left: 100,
      top: 100,
      width: 400,
      height: 600,
    };

    const position = visibleViewportCenterPct(scrolledCanvas, viewport);
    expect(position.xPct).toBe(50);
    expect(position.yPct).toBeCloseTo(57.5);
  });
});

describe("widthPxToPct", () => {
  it("expresses a pixel width as a percentage of the canvas width", () => {
    expect(widthPxToPct(200, canvas)).toBe(50);
  });
});

describe("anchor geometry conversion", () => {
  it("round-trips centre and width through a section rectangle", () => {
    const rect: Rect = { left: 100, top: 600, width: 400, height: 200 };
    const pixels = pixelGeometryFromPercent(rect, 25, 75, 40);

    expect(pixels).toEqual({ centerX: 200, centerY: 750, widthPx: 160 });
    expect(
      percentGeometryFromPixels(
        rect,
        pixels.centerX,
        pixels.centerY,
        pixels.widthPx,
      ),
    ).toEqual({ xPct: 25, yPct: 75, widthPct: 40 });
  });

  it("retains percentages outside 0..100 for unrestricted placement", () => {
    const rect: Rect = { left: 100, top: 600, width: 400, height: 200 };

    expect(percentGeometryFromPixels(rect, 20, 840, 160)).toEqual({
      xPct: -20,
      yPct: 120,
      widthPct: 40,
    });
  });

  it("preserves pixels when changing anchors", () => {
    const page: Rect = { left: 100, top: -1000, width: 400, height: 6000 };
    const dress: Rect = { left: 100, top: 500, width: 400, height: 240 };
    const oldPixels = pixelGeometryFromPercent(page, 50, 27, 30);
    const next = percentGeometryFromPixels(
      dress,
      oldPixels.centerX,
      oldPixels.centerY,
      oldPixels.widthPx,
    );

    expect(
      pixelGeometryFromPercent(dress, next.xPct, next.yPct, next.widthPct),
    ).toEqual(oldPixels);
  });
});

describe("migrateLegacyImageItems", () => {
  const legacyItem: ImageItem = {
    id: "patricia-dress-code",
    src: "/dress.png",
    naturalAspect: 1,
    xPct: 48.3391,
    yPct: 63.8288,
    widthPct: 28.9272,
    aspect: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
    opacity: 1,
    radiusPct: 0,
    blurPx: 0,
    shadow: null,
    crop: { offsetXPct: 50, offsetYPct: 50, zoom: 1 },
    z: 1,
  };

  it("anchors a legacy item without moving or resizing it", () => {
    const page: Rect = { left: 390, top: 0, width: 500, height: 6700 };
    const dress: ImageAnchorRect = {
      sectionKey: "dressCode",
      left: 390,
      top: 4200,
      width: 500,
      height: 360,
    };
    const before = pixelGeometryFromPercent(
      page,
      legacyItem.xPct,
      legacyItem.yPct,
      legacyItem.widthPct,
    );
    const migrated = migrateLegacyImageItems([legacyItem], page, [dress]);
    const item = migrated[0];

    expect(item.sectionKey).toBe("dressCode");
    expect(
      pixelGeometryFromPercent(dress, item.xPct, item.yPct, item.widthPct),
    ).toEqual(before);
  });

  it("is idempotent for already anchored items", () => {
    const anchored = { ...legacyItem, sectionKey: "dressCode" as const };
    const items = [anchored];

    expect(migrateLegacyImageItems(items, canvas, sections)).toBe(items);
  });

  it("keeps legacy items unchanged when no sections are measurable", () => {
    const items = [legacyItem];

    expect(migrateLegacyImageItems(items, canvas, [])).toBe(items);
  });
});

describe("resizeWidthPct", () => {
  it("computes width % from the pointer distance to box center", () => {
    expect(
      resizeWidthPct({ centerX: 200, centerY: 150 }, 300, 150, canvas),
    ).toBe(50);
  });

  it("never returns below a 2% floor", () => {
    expect(
      resizeWidthPct({ centerX: 200, centerY: 150 }, 200, 150, canvas),
    ).toBe(2);
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
