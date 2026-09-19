"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE } from "@/components/shared/animations";
import { autoScrollFrame, idleDelay, isUserScroll } from "@/lib/minimalism-brown";

// ---------------------------------------------------------------------------
// Motion mode
// ---------------------------------------------------------------------------

interface MbMotionValue {
  /** Admin preview — an editor is working, so nothing should move on its own. */
  instant: boolean;
  /** The viewer asked their OS for less motion. */
  reduced: boolean;
  /**
   * Show every section outright instead of revealing on scroll.
   *
   * Deliberately separate from `instant`: the reveal failsafe sets this, and
   * conflating the two would also switch off the opening auto-scroll, which
   * has nothing to do with whether content is visible.
   */
  revealAll: boolean;
  /** Called by the first reveal that fires, proving the observer works. */
  notifyRevealed: () => void;
}

const MbMotionContext = createContext<MbMotionValue>({
  instant: false,
  reduced: false,
  revealAll: false,
  notifyRevealed: () => {},
});

/** How long to wait for proof that IntersectionObserver works. The topmost
 *  section is on screen at mount, so a working observer reports back almost
 *  immediately. */
const REVEAL_PROOF_MS = 2500;

export function MbMotionProvider({
  instant,
  children,
}: {
  instant: boolean;
  children: ReactNode;
}) {
  // `useReducedMotion` starts as null on the server and resolves on mount, so
  // the first client render matches the server and there's no hydration flash.
  const reduced = useReducedMotion() ?? false;

  // Scroll reveals start at opacity 0, so a viewport where
  // IntersectionObserver never fires renders a blank invitation. That is not
  // hypothetical — embedded webviews can lay out at zero height, and this page
  // has a history of blank-screening in one.
  //
  // Rather than a blind timer (which would rob a slow reader of every reveal
  // below the fold), wait for proof: the first section is on screen at mount,
  // so a working observer reports back within a moment. Silence means the
  // mechanism is broken, and we show everything.
  const [forced, setForced] = useState(false);
  const proven = useRef(false);

  const notifyRevealed = useCallback(() => {
    proven.current = true;
  }, []);

  useEffect(() => {
    if (instant) return;
    if (typeof window === "undefined") return;

    // A viewport that can't observe anything is known-broken up front;
    // otherwise wait for proof. Both go through a timer so the state update
    // never runs synchronously inside the effect.
    const degenerate =
      !("IntersectionObserver" in window) ||
      window.innerHeight === 0 ||
      document.documentElement.clientHeight === 0;

    const timer = window.setTimeout(
      () => {
        if (degenerate || !proven.current) setForced(true);
      },
      degenerate ? 0 : REVEAL_PROOF_MS,
    );
    return () => window.clearTimeout(timer);
  }, [instant]);

  return (
    <MbMotionContext.Provider
      value={{
        instant,
        reduced,
        revealAll: instant || reduced || forced,
        notifyRevealed,
      }}
    >
      {children}
    </MbMotionContext.Provider>
  );
}

export function useMbMotion(): MbMotionValue {
  return useContext(MbMotionContext);
}

// ---------------------------------------------------------------------------
// Scroll reveals
// ---------------------------------------------------------------------------

const viewport = { once: true, margin: "-70px" } as const;

/** Stagger container — children arrive in sequence. */
export const mbGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Standard child: fade + rise. */
export const mbItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Small elements (swatches, calendar cells, gallery tiles). */
export const mbPop: Variants = {
  hidden: { opacity: 0, scale: 0.86 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

/**
 * Shared animation props for a revealing element.
 *
 * `revealAll` drives the SAME motion element to its visible state rather than
 * swapping in a plain one. Swapping would hand the node back to the browser
 * mid-animation and leave framer-motion's last inline style — `opacity: 0` —
 * on it permanently, which is exactly the blank-content failure the failsafe
 * exists to prevent.
 */
function useRevealProps(revealAll: boolean, onReveal: () => void) {
  return revealAll
    ? ({ initial: "visible" as const, animate: "visible" as const })
    : ({
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport,
        onViewportEnter: onReveal,
      });
}

/**
 * Reveal a block as it enters the viewport.
 *
 * Shows immediately in preview, under reduced motion, or if the reveal
 * mechanism is found to be broken.
 */
export function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 22,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "header" | "footer";
}) {
  const { revealAll, notifyRevealed } = useMbMotion();
  const Comp = motion[Tag];
  const props = useRevealProps(revealAll, notifyRevealed);

  return (
    <Comp
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: EASE, delay },
        },
      }}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** Stagger wrapper — pair with `RevealItem` children. */
export function RevealGroup({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { revealAll, notifyRevealed } = useMbMotion();
  const props = useRevealProps(revealAll, notifyRevealed);
  return (
    <motion.div
      className={className}
      style={style}
      variants={mbGroup}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * A staggered child. Inherits its state from the enclosing `RevealGroup`, so
 * it needs variants but no trigger of its own.
 */
export function RevealItem({
  children,
  className,
  style,
  variant = mbItem,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: Variants;
}) {
  return (
    <motion.div className={className} style={style} variants={variant}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Idle motion
// ---------------------------------------------------------------------------

export type IdleName = "sway" | "float" | "breathe" | "bob" | "shimmer";

/**
 * Props for a looping idle animation, staggered so a group of elements drifts
 * rather than pulsing in unison. Returns nothing under reduced motion.
 *
 * These run as CSS animations rather than framer-motion: they never stop, and
 * a compositor-only transform loop costs no main-thread work per frame.
 */
export function useIdle(
  name: IdleName,
  index = 0,
  cycleSeconds = 7,
): CSSProperties {
  const { reduced } = useMbMotion();
  if (reduced) return {};
  return {
    animationName: `mb-${name}`,
    animationDuration: `${cycleSeconds}s`,
    animationDelay: `-${idleDelay(index, cycleSeconds)}s`,
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    willChange: "transform",
  };
}

/**
 * Keyframes for every idle loop, plus the reduced-motion kill switch.
 *
 * Mounted once by the page. The media query is the backstop: even if a
 * component forgets `useIdle`, motion still stops for viewers who asked for
 * less of it.
 */
export function MbKeyframes() {
  return (
    <style>{`
@keyframes mb-sway {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(0, -9px, 0) rotate(1.1deg); }
}
@keyframes mb-float {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%      { transform: translate3d(0, -7px, 0); }
}
@keyframes mb-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
@keyframes mb-bob {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-1.5deg); }
  50%      { transform: translate3d(0, -10px, 0) rotate(1.5deg); }
}
@keyframes mb-shimmer {
  0%, 100% { opacity: 0.72; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.04); }
}
@keyframes mb-cue {
  0%, 100% { opacity: 0.35; transform: translate3d(0, 0, 0); }
  50%      { opacity: 0.9;  transform: translate3d(0, 6px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  [style*="mb-sway"], [style*="mb-float"], [style*="mb-breathe"],
  [style*="mb-bob"], [style*="mb-shimmer"], .mb-cue {
    animation: none !important;
  }
}
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Opening auto-scroll
// ---------------------------------------------------------------------------

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
  speedPxPerSec = 46,
  startDelayMs = 1400,
}: {
  enabled: boolean;
  speedPxPerSec?: number;
  startDelayMs?: number;
}) {
  const { reduced, instant } = useMbMotion();
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!enabled || reduced || instant) return;
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
      if (!cancelled.current && isUserScroll(window.scrollY, state.lastY)) stop();
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
  }, [enabled, reduced, instant, speedPxPerSec, startDelayMs]);

  return running;
}
