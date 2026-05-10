import type { TemplateTheme } from "./types";
import type { CSSProperties } from "react";

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
 * Derives the gold-coin base + accent colors from the theme.
 * The base color uses `theme.decorativeColor` when present; otherwise
 * a brushed-gold default. The accent (lighter highlight) is currently
 * a fixed light gold — a future task may derive it from the base.
 */
export function resolveCoinColors(
  theme: Pick<TemplateTheme, "decorativeColor"> | { decorativeColor?: string },
): { baseColor: string; accentColor: string } {
  const baseColor = theme.decorativeColor || "#C9A961";
  const accentColor = "#F4E4A1";
  return { baseColor, accentColor };
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
