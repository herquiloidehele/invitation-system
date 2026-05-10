import type { TemplateTheme, TextStyle, TextStyleOverrides } from "./types";
import type { CSSProperties } from "react";

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

/**
 * Returns the abbreviated month name in pt-PT for an ISO date string.
 * Strips the trailing dot that pt-PT formatters often append.
 *
 * If `iso` is invalid, returns the optional `fallback` (e.g. invitation.date.month)
 * or an empty string.
 */
export function shortMonthName(iso: string, fallback = ""): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat("pt-PT", { month: "short" })
      .format(d)
      .replace(".", "");
  } catch {
    return fallback;
  }
}



/**
 * Curtain-canva uses invitation.videoUrl as the optional curtain animation.
 * If not set, the bundled default keeps existing invitations working.
 */
export function resolveCurtainVideoSrc(videoUrl?: string | null): string {
  return videoUrl || DEFAULT_CURTAIN_VIDEO_SRC;
}

export function resolveRevealContentStyle(revealed: boolean): CSSProperties {
  return {
    visibility: revealed ? "visible" : "hidden",
    pointerEvents: revealed ? "auto" : "none",
  };
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
 * Builds a small celebratory color palette derived from the theme's accent
 * and decorative colors. Used by the confetti burst that fires after the
 * user scratches the last save-the-date coin. Falls back to a warm gold
 * + ivory palette so the burst still feels on-brand for unset themes.
 */
export function resolveCelebrationPalette(
  theme: Pick<TemplateTheme, "accent" | "decorativeColor"> | {
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
