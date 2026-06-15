import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import HeroTextOverlay from "@/components/shared/HeroTextOverlay";
import type { ResolvedHeroFonts } from "@/lib/hero-text";
import type { HeroTextLayer } from "@/lib/types";

const fonts: ResolvedHeroFonts = {
  display: "Display",
  body: "Body",
  script: "Script",
  ui: "Ui",
};

const layer: HeroTextLayer = {
  hideDefaultText: true,
  blocks: [
    {
      id: "a",
      content: "Ana & João",
      xPct: 50,
      yPct: 40,
      widthPct: 80,
      fontKey: "display",
      fontSizeCqw: 8,
      color: "#ffffff",
      fontWeight: 500,
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.1,
      shadow: true,
      z: 1,
    },
  ],
};

describe("HeroTextOverlay", () => {
  it("renders nothing when there are no blocks", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, {
        layer: { hideDefaultText: false, blocks: [] },
        fonts,
      }),
    );
    expect(html).toBe("");
  });

  it("renders nothing when layer is undefined", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, { layer: undefined, fonts }),
    );
    expect(html).toBe("");
  });

  it("renders each block's content and position", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, { layer, fonts }),
    );
    expect(html).toContain("Ana &amp; João");
    expect(html).toContain("left:50%");
    expect(html).toContain("top:40%");
  });

  it("keeps blocks static by default — position and text in one element", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, { layer, fonts }),
    );
    // In the static path a single element carries BOTH the position and the
    // colour, so they appear inside the same style="…" attribute.
    expect(html).toMatch(/left:50%[^"]*color:/);
  });

  it("splits position (outer) from text (inner) when play is set", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, { layer, fonts, play: true }),
    );
    expect(html).toContain("Ana &amp; João"); // content preserved
    expect(html).toContain("left:50%"); // positioning preserved (outer)
    expect(html).toContain("color:#ffffff"); // text style preserved (inner)
    // …but they are NOT in the same style attribute any more.
    expect(html).not.toMatch(/left:50%[^"]*color:/);
  });
});
