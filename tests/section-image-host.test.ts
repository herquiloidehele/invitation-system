import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SectionImageHost from "@/components/shared/SectionImageHost";
import type { ImageItem, ImageLayer } from "@/lib/types";

function makeItem(
  id: string,
  src: string,
  sectionKey: ImageItem["sectionKey"],
): ImageItem {
  return {
    id,
    src,
    sectionKey,
    xPct: 50,
    yPct: 50,
    widthPct: 30,
    aspect: 1,
    naturalAspect: 1,
    rotation: 0,
    opacity: 1,
    radiusPct: 0,
    blurPx: 0,
    z: 1,
    shadow: null,
    flipH: false,
    flipV: false,
    crop: { zoom: 1, offsetXPct: 50, offsetYPct: 50 },
  };
}

const layer: ImageLayer = {
  items: [
    makeItem("dress", "/dress.png", "dressCode"),
    makeItem("schedule", "/schedule.png", "schedule"),
  ],
};

describe("SectionImageHost", () => {
  it("renders only images assigned to its section", () => {
    const html = renderToStaticMarkup(
      createElement(
        SectionImageHost,
        { sectionKey: "dressCode", layer },
        createElement("div", null, "Dress content"),
      ),
    );

    expect(html).toContain('data-section-key="dressCode"');
    expect(html).toContain("/dress.png");
    expect(html).not.toContain("/schedule.png");
  });

  it("keeps section overflow visible for unrestricted placement", () => {
    const html = renderToStaticMarkup(
      createElement(
        SectionImageHost,
        { sectionKey: "dressCode", layer },
        createElement("div", null, "Dress content"),
      ),
    );

    expect(html).toContain("overflow:visible");
  });
});
