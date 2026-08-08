import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SectionImageHost from "@/components/shared/SectionImageHost";
import type { ImageItem, ImageLayer } from "@/lib/types";

type TestSectionImageHostProps = Omit<
  ComponentProps<typeof SectionImageHost>,
  "children"
> & {
  children?: ReactNode;
  frontLayerPosition?: "above-content" | "interleaved";
};

const TestSectionImageHost = SectionImageHost as (
  props: TestSectionImageHostProps,
) => ReactNode;

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
  it("keeps the content wrapper stable when the first image is assigned", () => {
    const render = (imageLayer?: ImageLayer) =>
      renderToStaticMarkup(
        createElement(
          TestSectionImageHost,
          { sectionKey: "canvaDetails", layer: imageLayer },
          createElement("section", null, "Canva content"),
        ),
      );

    expect(render()).toContain('data-section-image-content="true"');
    expect(
      render({
        items: [makeItem("canva", "/canva.png", "canvaDetails")],
      }),
    ).toContain('data-section-image-content="true"');
  });

  it("keeps the host overflow mode stable before the first image", () => {
    const html = renderToStaticMarkup(
      createElement(
        TestSectionImageHost,
        { sectionKey: "canvaDetails" },
        createElement("section", null, "Canva content"),
      ),
    );

    expect(html).toContain("overflow:visible");
  });

  it("renders only images assigned to its section", () => {
    const html = renderToStaticMarkup(
      createElement(
        TestSectionImageHost,
        {
          sectionKey: "dressCode",
          layer,
        },
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
        TestSectionImageHost,
        {
          sectionKey: "dressCode",
          layer,
        },
        createElement("div", null, "Dress content"),
      ),
    );

    expect(html).toContain("overflow:visible");
  });

  it("does not apply layout containment that resizes embedded sections", () => {
    const html = renderToStaticMarkup(
      createElement(
        TestSectionImageHost,
        {
          sectionKey: "canvaDetails",
          layer: {
            items: [makeItem("canva", "/canva.png", "canvaDetails")],
          },
        },
        createElement("section", null, "Canva content"),
      ),
    );

    expect(html).not.toContain("container-type");
  });

  it("interleaves hero images below protected cover surfaces", () => {
    const html = renderToStaticMarkup(
      createElement(
        TestSectionImageHost,
        {
          sectionKey: "dressCode",
          layer,
          frontLayerPosition: "interleaved",
        },
        createElement("section", { style: { zIndex: 8 } }, "Curtain cover"),
      ),
    );

    expect(html).toContain(
      'data-section-image-content="true" style="position:relative"',
    );
    expect(html).toContain('data-image-band="front"');
    expect(html).toContain("z-index:4");
  });

  it("renders an entrance image only in its semantic host", () => {
    const entranceLayer: ImageLayer = {
      items: [makeItem("rsvp-bg", "/rsvp.png", "rsvp")],
    };
    const html = renderToStaticMarkup(
      createElement(
        TestSectionImageHost,
        { sectionKey: "rsvp", layer: entranceLayer },
        createElement("section", null, "RSVP content"),
      ),
    );

    expect(html).toContain('data-section-key="rsvp"');
    expect(html).toContain("/rsvp.png");
    expect(html).toContain("RSVP content");
  });
});
