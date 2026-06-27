import type { HeroScrollIndicatorConfig } from "@/lib/types";

/** Default chevron icon size in px; the button renders at 2× this. */
export const DEFAULT_HERO_SCROLL_INDICATOR_SIZE = 24;
/** Default vertical offset in px added to the audio-aware bottom baseline. */
export const DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y = 0;

/** Slider bounds for the admin form (single source of truth). */
export const HERO_SCROLL_INDICATOR_SIZE_MIN = 16;
export const HERO_SCROLL_INDICATOR_SIZE_MAX = 56;
export const HERO_SCROLL_INDICATOR_OFFSET_Y_MIN = -84;
export const HERO_SCROLL_INDICATOR_OFFSET_Y_MAX = 240;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface ResolvedHeroScrollIndicator {
  /** Chevron icon size in px. */
  iconSize: number;
  /** Button (tap target) size in px — always 2× the icon. */
  buttonSize: number;
  /** Computed CSS `bottom`: safe-area inset + audio-aware base + offset. */
  bottom: string;
}

/**
 * Resolve the stored scroll-indicator config into render-ready values,
 * applying defaults and clamps. `audioEnabled` selects the bottom baseline
 * (6rem to clear the audio player, otherwise 2rem).
 */
export function resolveHeroScrollIndicator(
  config: Pick<HeroScrollIndicatorConfig, "size" | "offsetY"> | undefined,
  audioEnabled: boolean,
): ResolvedHeroScrollIndicator {
  const iconSize = clamp(
    config?.size ?? DEFAULT_HERO_SCROLL_INDICATOR_SIZE,
    HERO_SCROLL_INDICATOR_SIZE_MIN,
    HERO_SCROLL_INDICATOR_SIZE_MAX,
  );
  const offsetY = clamp(
    config?.offsetY ?? DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y,
    HERO_SCROLL_INDICATOR_OFFSET_Y_MIN,
    HERO_SCROLL_INDICATOR_OFFSET_Y_MAX,
  );
  const base = audioEnabled ? "6rem" : "2rem";
  return {
    iconSize,
    buttonSize: iconSize * 2,
    bottom: `calc(env(safe-area-inset-bottom) + ${base} + ${offsetY}px)`,
  };
}
