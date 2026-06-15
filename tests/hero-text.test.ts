import { describe, expect, it } from "vitest";

import {
  clampPct,
  heroFontFamily,
  heroTextBlockPositionStyle,
  heroTextBlockStyle,
  heroTextBlockTextStyle,
  heroTextLayerFontStacks,
  normalizeHeroTextLayer,
  pxToPct,
  type ResolvedHeroFonts,
} from "@/lib/hero-text";
import type { HeroTextBlock } from "@/lib/types";

describe("clampPct", () => {
  it("clamps below 0 to 0 and above 100 to 100", () => {
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(150)).toBe(100);
    expect(clampPct(42)).toBe(42);
  });

  it("treats NaN as 0", () => {
    expect(clampPct(Number.NaN)).toBe(0);
  });
});

describe("pxToPct", () => {
  it("converts a pixel value to a percentage of the total", () => {
    expect(pxToPct(50, 200)).toBe(25);
  });

  it("returns 0 when the total is 0 or negative", () => {
    expect(pxToPct(50, 0)).toBe(0);
    expect(pxToPct(50, -10)).toBe(0);
  });
});

describe("normalizeHeroTextLayer", () => {
  it("returns a safe empty layer for null/undefined/non-objects", () => {
    expect(normalizeHeroTextLayer(null)).toEqual({
      hideDefaultText: false,
      blocks: [],
    });
    expect(normalizeHeroTextLayer(undefined)).toEqual({
      hideDefaultText: false,
      blocks: [],
    });
    expect(normalizeHeroTextLayer("nope")).toEqual({
      hideDefaultText: false,
      blocks: [],
    });
  });

  it("coerces hideDefaultText to a strict boolean", () => {
    expect(
      normalizeHeroTextLayer({ hideDefaultText: 1, blocks: [] })
        .hideDefaultText,
    ).toBe(false);
    expect(
      normalizeHeroTextLayer({ hideDefaultText: true, blocks: [] })
        .hideDefaultText,
    ).toBe(true);
  });

  it("fills missing block fields with defaults and clamps ranges", () => {
    const result = normalizeHeroTextLayer({
      hideDefaultText: true,
      blocks: [{ id: "a", content: "Hi", xPct: 200, fontKey: "bogus" }],
    });
    expect(result.blocks).toHaveLength(1);
    const b = result.blocks[0];
    expect(b.id).toBe("a");
    expect(b.content).toBe("Hi");
    expect(b.xPct).toBe(100); // clamped from 200
    expect(b.fontKey).toBe("display"); // invalid → default
    expect(b.color).toBe("#ffffff");
    expect(b.textAlign).toBe("center");
  });

  it("drops blocks that are not objects", () => {
    const result = normalizeHeroTextLayer({
      hideDefaultText: false,
      blocks: [null, 5, { id: "ok", content: "x" }],
    });
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].id).toBe("ok");
  });
});

const FONTS: ResolvedHeroFonts = {
  display: "DisplayFont",
  body: "BodyFont",
  script: "ScriptFont",
  ui: "UiFont",
};

const sampleBlock: HeroTextBlock = {
  id: "b1",
  content: "Ana & João",
  xPct: 50,
  yPct: 40,
  widthPct: 80,
  fontKey: "script",
  fontSizeCqw: 8,
  color: "#ffeeaa",
  fontWeight: 600,
  fontStyle: "italic",
  textAlign: "center",
  letterSpacing: 0.1,
  lineHeight: 1.2,
  shadow: true,
  rotation: 5,
  z: 3,
};

describe("heroFontFamily", () => {
  it("maps each role key to its font", () => {
    expect(heroFontFamily("display", FONTS)).toBe("DisplayFont");
    expect(heroFontFamily("body", FONTS)).toBe("BodyFont");
    expect(heroFontFamily("script", FONTS)).toBe("ScriptFont");
    expect(heroFontFamily("ui", FONTS)).toBe("UiFont");
  });
});

describe("heroTextBlockStyle", () => {
  it("positions by %, sizes by cqw with a px floor, and resolves the font", () => {
    const style = heroTextBlockStyle(sampleBlock, FONTS);
    expect(style.left).toBe("50%");
    expect(style.top).toBe("40%");
    expect(style.width).toBe("80%");
    expect(style.fontFamily).toBe("ScriptFont");
    expect(style.fontSize).toBe("max(11px, 8cqw)");
    expect(style.letterSpacing).toBe("0.1em");
    expect(style.transform).toBe("translate(-50%, -50%) rotate(5deg)");
    expect(style.textShadow).toBeTruthy();
  });

  it("omits rotation from the transform when 0/undefined", () => {
    const style = heroTextBlockStyle({ ...sampleBlock, rotation: 0 }, FONTS);
    expect(style.transform).toBe("translate(-50%, -50%)");
  });

  it("drops the text-shadow when shadow is false", () => {
    const style = heroTextBlockStyle({ ...sampleBlock, shadow: false }, FONTS);
    expect(style.textShadow).toBeUndefined();
  });

  it("prefers an explicit fontFamily over the role font", () => {
    const style = heroTextBlockStyle(
      { ...sampleBlock, fontFamily: "'Lobster', cursive" },
      FONTS,
    );
    expect(style.fontFamily).toBe("'Lobster', cursive");
  });

  it("falls back to the role font when fontFamily is empty", () => {
    const style = heroTextBlockStyle(
      { ...sampleBlock, fontFamily: "" },
      FONTS,
    );
    expect(style.fontFamily).toBe("ScriptFont");
  });
});

describe("heroTextBlockPositionStyle / heroTextBlockTextStyle", () => {
  it("position style carries only positioning + stacking", () => {
    expect(heroTextBlockPositionStyle(sampleBlock)).toEqual({
      position: "absolute",
      left: "50%",
      top: "40%",
      width: "80%",
      transform: "translate(-50%, -50%) rotate(5deg)",
      zIndex: 3,
    });
  });

  it("position style omits rotation from the transform when 0", () => {
    expect(
      heroTextBlockPositionStyle({ ...sampleBlock, rotation: 0 }).transform,
    ).toBe("translate(-50%, -50%)");
  });

  it("text style carries the visual properties and no positioning", () => {
    const text = heroTextBlockTextStyle(sampleBlock, FONTS);
    expect(text.fontFamily).toBe("ScriptFont");
    expect(text.fontSize).toBe("max(11px, 8cqw)");
    expect(text.color).toBe("#ffeeaa");
    expect(text.letterSpacing).toBe("0.1em");
    expect(text.textShadow).toBeTruthy();
    // positioning lives only on the position style
    expect(text.left).toBeUndefined();
    expect(text.top).toBeUndefined();
    expect(text.transform).toBeUndefined();
    expect(text.zIndex).toBeUndefined();
  });

  it("union of the two equals heroTextBlockStyle", () => {
    expect({
      ...heroTextBlockPositionStyle(sampleBlock),
      ...heroTextBlockTextStyle(sampleBlock, FONTS),
    }).toEqual(heroTextBlockStyle(sampleBlock, FONTS));
  });
});

describe("heroTextLayerFontStacks", () => {
  it("returns only the blocks' explicit font stacks", () => {
    const stacks = heroTextLayerFontStacks({
      hideDefaultText: false,
      blocks: [
        { ...sampleBlock, id: "a", fontFamily: "'Lobster', cursive" },
        { ...sampleBlock, id: "b", fontFamily: undefined },
        { ...sampleBlock, id: "c", fontFamily: "'Inter', sans-serif" },
      ],
    });
    expect(stacks).toEqual(["'Lobster', cursive", "'Inter', sans-serif"]);
  });

  it("returns an empty array for null/empty layers", () => {
    expect(heroTextLayerFontStacks(null)).toEqual([]);
    expect(
      heroTextLayerFontStacks({ hideDefaultText: false, blocks: [] }),
    ).toEqual([]);
  });
});
