import type { TemplateTheme } from "./types";

/**
 * Default seconds into the entrance video at which the hero text reveals,
 * used when the invitation has no `heroRevealSeconds` configured.
 */
export const DEFAULT_HERO_REVEAL_SECONDS = 5;

/**
 * Returns true when the theme should render via the VideoEntrancePage
 * pipeline: a single tap-to-play video that doubles as cover + hero.
 */
export function isVideoEntranceLayout(
  theme: Pick<TemplateTheme, "layout"> | { layout?: string | null },
): boolean {
  return theme.layout === "video-entrance";
}

/**
 * Normalizes the admin-configured reveal time into a usable number of
 * seconds. Falls back to DEFAULT_HERO_REVEAL_SECONDS when unset, non-finite,
 * or negative so the hero always has a sane threshold.
 */
export function resolveHeroRevealSeconds(
  value: number | null | undefined,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return DEFAULT_HERO_REVEAL_SECONDS;
  }
  return value;
}

/**
 * Returns true once the entrance video has played at least `revealSeconds`,
 * i.e. the hero text should now fade in. Guards non-finite/negative
 * currentTime so a bad timeupdate event never triggers an early reveal.
 */
export function shouldRevealHeroAtTime(
  currentTime: number,
  revealSeconds: number,
): boolean {
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;
  return currentTime >= revealSeconds;
}

/**
 * Admin toggle for the video-entrance hero confetti. Opt-IN: confetti fires
 * only when explicitly enabled (`{ enabled: true }`). Unset → no confetti,
 * matching the "off by default" decision for this layout. (Distinct from
 * curtain-canva's `shouldFireHeroConfetti`, which is opt-out.)
 */
export function shouldFireVideoEntranceConfetti(
  config: { enabled: boolean } | null | undefined,
): boolean {
  return config?.enabled === true;
}
