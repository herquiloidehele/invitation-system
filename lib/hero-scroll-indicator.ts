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

export interface ResolveHeroScrollIndicatorOptions {
  /** Effective `enabled` when `config.enabled` is unset. Defaults to false. */
  defaultEnabled?: boolean;
  /** Icon size (px) used when `config.size` is unset. Defaults to 24. */
  defaultSize?: number;
}

export interface ResolvedHeroScrollIndicator {
  /** Whether the indicator should render. */
  enabled: boolean;
  /** Chevron icon size in px. */
  iconSize: number;
  /** Button (tap target) size in px — always 2× the icon. */
  buttonSize: number;
  /** Clamped vertical offset in px (compose into `bottom` per layout). */
  offsetY: number;
}

/**
 * Resolve the stored scroll-indicator config into render-ready values,
 * applying defaults and clamps. Positioning is intentionally NOT computed
 * here — each layout composes its own `bottom` via `heroScrollIndicatorBottom`
 * because the baseline differs (audio-aware 6rem/2rem for the standard hero,
 * fixed 2rem for the video-entrance / curtain-canva heroes).
 */
export function resolveHeroScrollIndicator(
  config: Partial<HeroScrollIndicatorConfig> | undefined,
  opts: ResolveHeroScrollIndicatorOptions = {},
): ResolvedHeroScrollIndicator {
  const iconSize = clamp(
    config?.size ?? opts.defaultSize ?? DEFAULT_HERO_SCROLL_INDICATOR_SIZE,
    HERO_SCROLL_INDICATOR_SIZE_MIN,
    HERO_SCROLL_INDICATOR_SIZE_MAX,
  );
  const offsetY = clamp(
    config?.offsetY ?? DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y,
    HERO_SCROLL_INDICATOR_OFFSET_Y_MIN,
    HERO_SCROLL_INDICATOR_OFFSET_Y_MAX,
  );
  return {
    enabled: config?.enabled ?? opts.defaultEnabled ?? false,
    iconSize,
    buttonSize: iconSize * 2,
    offsetY,
  };
}

/** Compose the CSS `bottom` for the indicator: safe-area + layout base + offset. */
export function heroScrollIndicatorBottom(
  base: string,
  offsetY: number,
): string {
  return `calc(env(safe-area-inset-bottom) + ${base} + ${offsetY}px)`;
}
