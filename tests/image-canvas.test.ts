import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ImageCanvas from "@/components/shared/ImageCanvas";
import type { ImageLayer } from "@/lib/types";

const layer: ImageLayer = {
  items: [
    {
      id: "front",
      src: "/front.png",
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
    },
  ],
};

const mixedLayer: ImageLayer = {
  items: [
    {
      ...layer.items[0],
      id: "dress",
      src: "/dress.png",
      sectionKey: "dressCode",
    },
    { ...layer.items[0], id: "legacy", src: "/legacy.png" },
  ],
};

describe("ImageCanvas", () => {
  it("leaves hosted section items to SectionImageHost", () => {
    const html = renderToStaticMarkup(
      createElement(
        ImageCanvas,
        { layer: mixedLayer, hostedSectionKeys: ["dressCode"] },
        createElement("section", null, "Content"),
      ),
    );

    expect(html).not.toContain("/dress.png");
    expect(html).toContain("/legacy.png");
  });

  it("falls back to the page canvas when an anchor is not hosted", () => {
    const html = renderToStaticMarkup(
      createElement(ImageCanvas, { layer: mixedLayer }, null),
    );

    expect(html).toContain("/dress.png");
    expect(html).toContain("/legacy.png");
  });

  it("renders front images above content by default", () => {
    const html = renderToStaticMarkup(
      createElement(
        ImageCanvas,
        { layer },
        createElement("section", null, "Cover content"),
      ),
    );

    expect(html.indexOf("Cover content")).toBeLessThan(
      html.indexOf('data-image-band="front"'),
    );
  });

  it("can render front images below protected content", () => {
    const html = renderToStaticMarkup(
      createElement(
        ImageCanvas,
        { layer, frontLayerPosition: "below-content" },
        createElement("section", null, "Protected cover"),
      ),
    );

    expect(html.indexOf('data-image-band="front"')).toBeLessThan(
      html.indexOf("Protected cover"),
    );
  });

  it("can render front images as a middle layer above hero media but below promoted cover surfaces", () => {
    const html = renderToStaticMarkup(
      createElement(
        ImageCanvas,
        { layer, frontLayerPosition: "interleaved" },
        createElement("section", null, "Hero content"),
      ),
    );

    expect(html).toContain('data-image-band="front"');
    expect(html).toContain("z-index:4");
    expect(html).not.toContain('z-index:1">Hero content');
  });

  it("interleaves front images in the entrance curtain and video cover layouts", () => {
    const curtainPage = readFileSync(
      "components/curtain-canva/CurtainCanvaPage.tsx",
      "utf8",
    );
    expect(curtainPage).toContain('frontLayerPosition="interleaved"');

    const videoPage = readFileSync(
      "components/video-entrance/VideoEntrancePage.tsx",
      "utf8",
    );
    expect(videoPage).toContain('frontLayerPosition="interleaved"');
  });

  it("promotes only unrevealed entrance cover surfaces above interleaved images", () => {
    const curtainHero = readFileSync(
      "components/curtain-canva/CurtainsHero.tsx",
      "utf8",
    );
    expect(curtainHero).toContain('zIndex: state === "revealed" ? 2 : 8');

    const videoHero = readFileSync(
      "components/video-entrance/VideoEntranceHero.tsx",
      "utf8",
    );
    expect(videoHero).toContain('zIndex: state === "revealed" ? 2 : 8');
  });

  it("does not make entrance page mains vertical scroll containers", () => {
    const curtainPage = readFileSync(
      "components/curtain-canva/CurtainCanvaPage.tsx",
      "utf8",
    );
    expect(curtainPage).not.toContain("overflow-x-hidden");
    expect(curtainPage).toContain('overflowX: "clip"');

    const videoPage = readFileSync(
      "components/video-entrance/VideoEntrancePage.tsx",
      "utf8",
    );
    expect(videoPage).not.toContain("overflow-x-hidden");
    expect(videoPage).toContain('overflowX: "clip"');
  });

  it("does not make the global body a vertical scroll container while clipping horizontal spill", () => {
    const globals = readFileSync("app/globals.css", "utf8");

    expect(globals).not.toContain("overflow-x: hidden");
    expect(globals).toContain("overflow-x: clip");
  });
});
