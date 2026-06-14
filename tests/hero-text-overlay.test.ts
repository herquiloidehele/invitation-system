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
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, { layer, fonts }),
    );
    expect(html).toContain("Ana &amp; João");
    expect(html).toContain("left:50%");
    expect(html).toContain("top:40%");
  });
});
