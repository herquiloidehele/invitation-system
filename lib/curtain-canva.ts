import type {
  ScratchRevealConfig,
  TemplateTheme,
  TextStyle,
  TextStyleOverrides,
} from "./types";
import type { CSSProperties } from "react";
import { GOLDEN_GLITTER_PALETTE } from "./scratch-texture";

type CurtainElementKey = keyof NonNullable<TextStyleOverrides["elements"]>;

/**
 * Returns the per-element text style override stored on an invitation for
 * the given element key, or an empty object when nothing has been set.
 *
 * Curtain-canva components apply this on top of their own inline styles so
 * the admin's element-level overrides (font, size, weight, color, letter
 * spacing) win without us having to plug into the larger `resolveTextStyles`
 * pipeline used by the standard invitation. The empty-object fallback lets
 * callers spread it unconditionally: `style={{ ...defaults, ...override }}`.
 */
export function resolveTextElementOverride(
  overrides: TextStyleOverrides | undefined | null,
  element: CurtainElementKey,
): TextStyle {
  return overrides?.elements?.[element] ?? {};
}

export const DEFAULT_CURTAIN_VIDEO_SRC = "/videos/curtains.mp4";

/**
 * Returns true when the theme should render via the CurtainCanvaPage
 * pipeline (skips envelope, plays curtains video, etc.).
 */
export function isCurtainCanvaLayout(
  theme: Pick<TemplateTheme, "layout"> | { layout?: string | null },
): boolean {
  return theme.layout === "curtain-canva";
}

export function shouldRenderScratchReveal(
  scratchReveal: ScratchRevealConfig | null | undefined,
): boolean {
  return scratchReveal?.enabled === true;
}

// `shortMonthName` moved to `lib/date-format.ts` (`formatLocalizedMonthShort`)
// so it can vary with the URL locale instead of being hardcoded to pt-PT.

/**
 * Curtain-canva uses invitation.curtainVideoUrl as the optional curtain
 * animation. If not set, the bundled default keeps existing invitations
 * working. (invitation.videoUrl is the hero background video, not the curtain.)
 */
export function resolveCurtainVideoSrc(videoUrl?: string | null): string {
  return videoUrl || DEFAULT_CURTAIN_VIDEO_SRC;
}

/**
 * The curtain-canva hero video section renders only when a hero video
 * (`invitation.videoUrl`) has been uploaded. Whitespace-only values count as
 * empty so a stray space in the admin field doesn't mount an empty <video>.
 *
 * Distinct from `resolveCurtainVideoSrc`, which resolves the *curtain*
 * animation (`invitation.curtainVideoUrl`) and applies the bundled default.
 */
export function shouldRenderCurtainHeroVideo(
  videoUrl: string | null | undefined,
): boolean {
  return typeof videoUrl === "string" && videoUrl.trim().length > 0;
}

export function resolveRevealContentStyle(revealed: boolean): CSSProperties {
  return {
    visibility: revealed ? "visible" : "hidden",
    pointerEvents: revealed ? "auto" : "none",
  };
}

type ScrollWindow = Pick<Window, "innerHeight" | "scrollTo">;

export function scrollToNextHeroSection(win: ScrollWindow = window): void {
  win.scrollTo({ top: win.innerHeight, behavior: "smooth" });
}

/**
 * Curtain hero progress threshold for showing the invitation info while the
 * curtain video is still playing. We reveal the names/date/quote at this
 * fraction of playback so the text is in place before the curtain is fully
 * open.
 */
export const HERO_INFO_REVEAL_PROGRESS = 0.5;

/**
 * Returns true when the curtain video has played far enough that the hero
 * info should fade in (currently `currentTime / duration >= 0.8`).
 *
 * Returns false when duration is missing, zero, or non-finite — in those
 * cases the caller should keep the info hidden until the video ends.
 */
export function shouldShowHeroInfoAtProgress(
  currentTime: number,
  duration: number,
): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;
  return currentTime / duration >= HERO_INFO_REVEAL_PROGRESS;
}

/**
 * Curtain video progress threshold for the celebration confetti burst.
 * Fires near the end of the curtain animation so the burst lands as the
 * curtain finishes opening, not at the visual end (which would feel late).
 */
export const CONFETTI_REVEAL_PROGRESS = 0.8;

/**
 * Returns true when the curtain video has crossed the configured confetti
 * threshold (defaults to 80% of duration). Returns false when duration is
 * missing/invalid so the caller can defer to the on-end handler instead.
 */
export function shouldFireConfettiAtProgress(
  currentTime: number,
  duration: number,
): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;
  return currentTime / duration >= CONFETTI_REVEAL_PROGRESS;
}

/**
 * Admin toggle for the curtain hero's celebration confetti. Confetti fires by
 * default (config unset → existing invitations keep their burst); only an
 * explicit `{ enabled: false }` from the admin form turns it off.
 */
export function shouldFireHeroConfetti(
  config: { enabled: boolean } | null | undefined,
): boolean {
  return config?.enabled !== false;
}

/**
 * Builds a small celebratory color palette derived from the theme's accent
 * and decorative colors. Used by the confetti burst that fires after the
 * user scratches the last save-the-date coin. Falls back to a warm gold
 * + ivory palette so the burst still feels on-brand for unset themes.
 */
export function resolveCelebrationPalette(
  theme:
    | Pick<TemplateTheme, "accent" | "decorativeColor">
    | {
        accent?: string;
        decorativeColor?: string;
      },
): string[] {
  const accent = theme.accent?.trim();
  const decorative = theme.decorativeColor?.trim();
  const palette = [
    accent || "#C9A961",
    decorative || "#F4E4A1",
    "#FFFFFF",
    "#E8D7A8",
  ];
  // Deduplicate while preserving order so the burst doesn't render the same
  // color twice when accent === decorativeColor.
  return Array.from(new Set(palette));
}

// ---------------------------------------------------------------------------
// Coin glitter palette (ScratchDateReveal / ScratchCoin)
// ---------------------------------------------------------------------------

/**
 * Parses a `#rgb` or `#rrggbb` hex string into RGB components. Returns null
 * for any input that isn't a well-formed hex color so callers can fall back
 * to a safe default instead of generating NaN-filled colors.
 */
function parseHexColor(
  input: string,
): { r: number; g: number; b: number } | null {
  const m = input.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

/**
 * Returns a new hex color that is `amount` (0..1) of the way toward black
 * (negative amount) or toward white (positive amount). Used to spread a
 * single accent color into the multi-tone glitter palette so the coin
 * material has enough internal variation to read as metallic.
 */
function shiftHexColor(hex: string, amount: number): string | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const target = amount >= 0 ? 255 : 0;
  const a = Math.abs(amount);
  const r = rgb.r + (target - rgb.r) * a;
  const g = rgb.g + (target - rgb.g) * a;
  const b = rgb.b + (target - rgb.b) * a;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Builds the glitter palette used by the scratch-off coins on the curtain-
 * canva save-the-date. The shape mirrors `GOLDEN_GLITTER_PALETTE` (base,
 * dark variant, light variant, pale variant, white highlight) so the
 * existing `generateGlitterTexture` layering logic keeps producing a
 * believable metallic surface — only the hue changes per theme.
 *
 * Falls back to the default gold palette when accent is missing or
 * malformed so unset themes still render the original look.
 */
export function resolveCoinGlitterPalette(
  theme:
    | Pick<TemplateTheme, "accent" | "decorativeColor">
    | { accent?: string; decorativeColor?: string },
): string[] {
  const accent = theme.accent?.trim();
  const decorative = theme.decorativeColor?.trim();

  if (!accent || !parseHexColor(accent)) {
    return [...GOLDEN_GLITTER_PALETTE];
  }

  const base = accent.toUpperCase();
  const dark = shiftHexColor(base, -0.18) ?? base;
  const light = shiftHexColor(base, 0.22) ?? base;
  const pale =
    decorative && parseHexColor(decorative)
      ? decorative.toUpperCase()
      : (shiftHexColor(base, 0.55) ?? base);

  const palette = [base, dark, light, pale, "#FFFFFF"];
  // Dedupe (case-insensitive) so the texture generator doesn't waste
  // particles on identical colors when accent/decorative collide.
  const seen = new Set<string>();
  return palette.filter((c) => {
    const key = c.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
