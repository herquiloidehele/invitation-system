"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { autoScrollFrame, isUserScroll } from "@/lib/auto-scroll";

// ---------------------------------------------------------------------------
// Opening auto-scroll
// ---------------------------------------------------------------------------

/**
 * How long the page sits still before the crawl begins.
 *
 * The hero's own reveal takes about a second, so anything much shorter than
 * this starts moving the page while the reader is still taking in the names
 * and the photo — it reads as the page running away from them rather than
 * offering to turn the page.
 */
const AUTO_SCROLL_DELAY_MS = 1500;

/**
 * Carry the reader gently down the page when the invitation opens, and get out
 * of the way the moment they take over.
 *
 * Yields on any sign of intent — wheel, touch, pointer, key, or a scroll
 * position that isn't the one we just set — and never resumes: re-grabbing the
 * page after someone has started reading is worse than not animating at all.
 *
 * Disabled entirely under reduced motion.
 */
export function useAutoScroll({
  enabled,
  speedPxPerSec = 150,
  startDelayMs = AUTO_SCROLL_DELAY_MS,
}: {
  enabled: boolean;
  speedPxPerSec?: number;
  startDelayMs?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!enabled || reduced) return;
    if (typeof window === "undefined") return;

    let raf = 0;
    let startTimer = 0;
    const state = { lastMs: 0, lastY: 0 };

    const stop = () => {
      cancelled.current = true;
      setRunning(false);
      cancelAnimationFrame(raf);
      window.clearTimeout(startTimer);
    };

    const onScroll = () => {
      if (!cancelled.current && isUserScroll(window.scrollY, state.lastY))
        stop();
    };

    const frame = (now: number) => {
      if (cancelled.current) return;

      // Yield if anything other than us moved the page since the last frame.
      //
      // The scroll *event* is not enough on its own: it is dispatched after
      // the frame that follows the move, so this loop can overwrite a scroll
      // before the listener ever sees it — and then we compare against our own
      // position and conclude nobody moved. That fights anyone scrolling
      // without a wheel or touch event: anchor jumps, browser scroll
      // restoration, screen readers, keyboard-driven scrolling.
      if (isUserScroll(window.scrollY, state.lastY)) {
        stop();
        return;
      }

      if (document.hidden) {
        // Don't accumulate time while the tab is away.
        state.lastMs = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const { nextY, done } = autoScrollFrame(
        now,
        state,
        speedPxPerSec,
        maxScrollY,
      );
      state.lastMs = now;
      state.lastY = nextY;
      // `behavior: "instant"` matters: globals.css sets `scroll-behavior:
      // smooth` document-wide, which would route each sub-pixel step of this
      // crawl through the smooth scroller — the position then lags what we
      // wrote, we mistake our own lag for the reader, and any other
      // programmatic scroll gets swallowed by ours.
      window.scrollTo({ top: nextY, behavior: "instant" });
      if (done) {
        setRunning(false);
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const begin = () => {
      if (cancelled.current) return;
      state.lastMs = performance.now();
      state.lastY = window.scrollY;
      setRunning(true);
      raf = requestAnimationFrame(frame);
    };

    const opts = { passive: true } as const;
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("pointerdown", stop, opts);
    window.addEventListener("keydown", stop);
    window.addEventListener("scroll", onScroll, opts);

    startTimer = window.setTimeout(begin, startDelayMs);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(startTimer);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, reduced, speedPxPerSec, startDelayMs]);

  return running;
}
