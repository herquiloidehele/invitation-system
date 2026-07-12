"use client";

import { useCallback, useRef } from "react";
import confetti from "canvas-confetti";

const DEFAULT_DURATION_MS = 1200;

export function useGiftConfettiNavigation(
  theme: { primary: string; secondary: string; accent: string },
) {
  const firingRef = useRef(false);

  const navigateToGifts = useCallback(
    (href: string, onNavigate: () => void) => {
      if (firingRef.current) return;

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        onNavigate();
        return;
      }

      firingRef.current = true;
      const colors = [theme.primary, theme.secondary, theme.accent, "#FFFFFF"];
      const end = Date.now() + DEFAULT_DURATION_MS;

      const frame = () => {
        confetti({
          particleCount: 10,
          spread: 55,
          startVelocity: 22,
          gravity: 1,
          scalar: 0.7,
          ticks: 130,
          origin: { x: 0.5, y: 0.6 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      window.setTimeout(() => {
        onNavigate();
      }, DEFAULT_DURATION_MS);
    },
    [theme.primary, theme.secondary, theme.accent],
  );

  return { navigateToGifts };
}
