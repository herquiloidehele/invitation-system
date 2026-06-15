import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Force prefers-reduced-motion ON for this file only.
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => true };
});

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

describe("HeroTextOverlay (reduced motion)", () => {
  it("renders the static markup even when play is true", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextOverlay, { layer, fonts, play: true }),
    );
    // Reduced motion => static path => position + colour in one style attr.
    expect(html).toMatch(/left:50%[^"]*color:/);
  });
});
