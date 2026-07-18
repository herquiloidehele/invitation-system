import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/admin/ImageLayerEditor.tsx", "utf8");

describe("ImageLayerEditor section anchor integration", () => {
  it("measures section hosts and migrates legacy items", () => {
    expect(source).toContain(
      'querySelectorAll<HTMLElement>("[data-section-key]")',
    );
    expect(source).toContain("migrateLegacyImageItems(");
  });

  it("uses anchor geometry for overlay and handle calculations", () => {
    expect(source).toContain("pixelGeometryFromPercent(");
    expect(source).toContain("rectForItem(");
  });

  it("re-anchors items while dragging across sections", () => {
    expect(source).toContain("findImageAnchorRect(");
    expect(source).toContain("percentGeometryFromPixels(");
    expect(source).toContain("sectionKey: target.sectionKey");
  });
});
