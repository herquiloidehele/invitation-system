import confetti from "canvas-confetti";

import type { EnvelopeConfig, TemplateTheme } from "@/lib/types";

/**
 * Default confetti palette derived from a theme. Mirrors the derivation used
 * by the curtain-canva hero celebration so confetti feels at home with the
 * invitation's colors.
 */
export function getDefaultConfettiColors(theme: TemplateTheme): string[] {
  return [
    theme.accent,
    theme.monogramColor || theme.accent,
    theme.textPrimary,
    "#ffffff",
  ].filter(Boolean) as string[];
}

/**
 * Resolve the confetti colors for an envelope-open celebration.
 * Returns `null` when confetti is disabled (the default), otherwise the
 * custom `colors` when provided, falling back to theme-derived defaults.
 */
export function resolveEnvelopeConfettiColors(
  envelope: EnvelopeConfig | undefined,
  theme: TemplateTheme,
): string[] | null {
  const conf = envelope?.confetti;
  if (!conf?.enabled) return null;
  return conf.colors && conf.colors.length > 0
    ? conf.colors
    : getDefaultConfettiColors(theme);
}

/**
 * Fire the celebratory multi-burst (a center burst followed by trailing
 * staggered side bursts). Shared by the Save the Date reveal and the
 * envelope-open celebration. Browser-only (calls canvas-confetti).
 */
export function fireCelebrationConfetti(colors: string[]): void {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.4,
    decay: 0.94,
    startVelocity: 20,
    colors,
    scalar: 1.2,
  };

  confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.45 } });
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      spread: 200,
      origin: { x: 0.4, y: 0.5 },
    });
  }, 150);
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      spread: 200,
      origin: { x: 0.6, y: 0.5 },
    });
  }, 300);
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 40,
      spread: 300,
      origin: { x: 0.5, y: 0.4 },
      startVelocity: 30,
    });
  }, 500);
}
