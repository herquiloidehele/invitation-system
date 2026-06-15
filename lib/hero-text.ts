import type { CSSProperties } from "react";

import type {
  HeroTextBlock,
  HeroTextFontKey,
  HeroTextLayer,
  TemplateTheme,
  TextStyleOverrides,
} from "./types";
import { resolveTextStyles } from "./text-styles";

/** Minimum rendered font size (px) so blocks stay legible on tiny screens. */
export const HERO_TEXT_MIN_FONT_PX = 11;

/** Resolved font-family strings for each theme font role. */
export interface ResolvedHeroFonts {
  display: string;
  body: string;
  script: string;
  ui: string;
}

/** Default values for a freshly-added block (id is supplied separately). */
export const DEFAULT_HERO_TEXT_BLOCK: Omit<HeroTextBlock, "id"> = {
  content: "Novo texto",
  xPct: 50,
  yPct: 50,
  widthPct: 80,
  fontKey: "display",
  fontSizeCqw: 8,
  color: "#ffffff",
  fontWeight: 500,
  fontStyle: "normal",
  textAlign: "center",
  letterSpacing: 0,
  lineHeight: 1.15,
  shadow: true,
  rotation: 0,
  z: 1,
};

/** An empty, feature-off layer. */
export const EMPTY_HERO_TEXT_LAYER: HeroTextLayer = {
  hideDefaultText: false,
  blocks: [],
};

const FONT_KEYS: HeroTextFontKey[] = ["display", "body", "script", "ui"];

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

/** Clamp a percentage to [0, 100]; NaN/invalid → 0. */
export function clampPct(value: number): number {
  return clampNumber(value, 0, 100, 0);
}

/** Convert a pixel value to a percentage of `total` (0 when total ≤ 0). */
export function pxToPct(px: number, total: number): number {
  if (!total || total <= 0) return 0;
  return (px / total) * 100;
}

/** Resolve a font role key to a concrete font-family string. */
export function heroFontFamily(
  fontKey: HeroTextFontKey,
  fonts: ResolvedHeroFonts,
): string {
  switch (fontKey) {
    case "body":
      return fonts.body;
    case "script":
      return fonts.script;
    case "ui":
      return fonts.ui;
    case "display":
    default:
      return fonts.display;
  }
}

/** Build ResolvedHeroFonts from a TemplateTheme + optional style overrides. */
export function heroFontsFromTheme(
  theme: TemplateTheme,
  textStyles?: TextStyleOverrides | null,
): ResolvedHeroFonts {
  const ts = resolveTextStyles(theme, textStyles ?? undefined);
  return {
    display: ts.displayFont,
    body: ts.bodyFont,
    script: ts.scriptFont,
    ui: ts.uiFont,
  };
}

/** Positioning + stacking styles for a block. Kept separate from the visual
 *  styles because this is where the `translate(-50%,-50%)` centering transform
 *  lives — an animation wrapper must apply its own transform to an INNER
 *  element so it doesn't clobber this centering. */
export function heroTextBlockPositionStyle(
  block: HeroTextBlock,
): CSSProperties {
  const rotation = block.rotation ?? 0;
  const transform = `translate(-50%, -50%)${
    rotation ? ` rotate(${rotation}deg)` : ""
  }`;
  return {
    position: "absolute",
    left: `${block.xPct}%`,
    top: `${block.yPct}%`,
    width: `${block.widthPct}%`,
    transform,
    zIndex: block.z,
  };
}

/** Visual/text styles for a block (everything except positioning + stacking). */
export function heroTextBlockTextStyle(
  block: HeroTextBlock,
  fonts: ResolvedHeroFonts,
): CSSProperties {
  return {
    fontFamily: block.fontFamily || heroFontFamily(block.fontKey, fonts),
    fontSize: `max(${HERO_TEXT_MIN_FONT_PX}px, ${block.fontSizeCqw}cqw)`,
    color: block.color,
    fontWeight: block.fontWeight,
    fontStyle: block.fontStyle,
    textAlign: block.textAlign,
    letterSpacing: `${block.letterSpacing}em`,
    lineHeight: block.lineHeight,
    whiteSpace: "pre-line",
    margin: 0,
    textShadow: block.shadow ? "0 2px 14px rgba(0,0,0,0.45)" : undefined,
  };
}

/** Compute the full inline CSS for a single hero text block. */
export function heroTextBlockStyle(
  block: HeroTextBlock,
  fonts: ResolvedHeroFonts,
): CSSProperties {
  return {
    ...heroTextBlockPositionStyle(block),
    ...heroTextBlockTextStyle(block, fonts),
  };
}

function normalizeBlock(raw: unknown, index: number): HeroTextBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const fontKey = FONT_KEYS.includes(b.fontKey as HeroTextFontKey)
    ? (b.fontKey as HeroTextFontKey)
    : "display";
  const fontStyle = b.fontStyle === "italic" ? "italic" : "normal";
  const textAlign =
    b.textAlign === "left" || b.textAlign === "right"
      ? (b.textAlign as "left" | "right")
      : "center";
  return {
    id: typeof b.id === "string" && b.id ? b.id : `block-${index}`,
    content: typeof b.content === "string" ? b.content : "",
    xPct: clampPct(typeof b.xPct === "number" ? b.xPct : 50),
    yPct: clampPct(typeof b.yPct === "number" ? b.yPct : 50),
    widthPct: clampNumber(b.widthPct, 5, 100, 80),
    fontKey,
    fontFamily:
      typeof b.fontFamily === "string" && b.fontFamily
        ? b.fontFamily
        : undefined,
    fontSizeCqw: clampNumber(b.fontSizeCqw, 1, 40, 8),
    color: typeof b.color === "string" ? b.color : "#ffffff",
    fontWeight: clampNumber(b.fontWeight, 100, 900, 500),
    fontStyle,
    textAlign,
    letterSpacing: clampNumber(b.letterSpacing, -0.2, 2, 0),
    lineHeight: clampNumber(b.lineHeight, 0.8, 3, 1.15),
    shadow: b.shadow !== false,
    rotation: clampNumber(b.rotation, -180, 180, 0),
    z: clampNumber(b.z, 0, 9999, index + 1),
  };
}

/**
 * The explicit CSS font-family stacks used by a layer's blocks — for passing
 * to `useDynamicFonts` so non-builtin Google Fonts get loaded.
 */
export function heroTextLayerFontStacks(
  layer?: HeroTextLayer | null,
): string[] {
  return (layer?.blocks ?? [])
    .map((b) => b.fontFamily)
    .filter((f): f is string => !!f);
}

/** Coerce arbitrary JSON (from the DB or form) into a safe HeroTextLayer. */
export function normalizeHeroTextLayer(value: unknown): HeroTextLayer {
  if (!value || typeof value !== "object") {
    return { hideDefaultText: false, blocks: [] };
  }
  const v = value as Record<string, unknown>;
  const blocks = Array.isArray(v.blocks)
    ? v.blocks
        .map((b, i) => normalizeBlock(b, i))
        .filter((b): b is HeroTextBlock => b !== null)
    : [];
  return {
    hideDefaultText: v.hideDefaultText === true,
    blocks,
  };
}
