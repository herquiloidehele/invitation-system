"use client";

import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, type Variants } from "framer-motion";
import { EASE } from "@/components/shared/animations";

/** Scroll-reveal viewport: play once, a little before the element is centered. */
export const efViewport = { once: true, margin: "-60px" } as const;

/** Stagger container — children animate in sequence. */
export const efGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};

/** Standard child: fade + rise. */
export const efItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/** Couple names: cinematic blur + scale rise. */
export const efNames: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.9, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.05, ease: EASE },
  },
};

/** Pop-in for small elements (countdown cells, swatches). */
export const efPop: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

// ---------------------------------------------------------------------------
// Reveal mode — "instant" (admin preview) shows everything on mount; otherwise
// sections reveal on scroll. Defaults to scroll-reveal for the live page.
// ---------------------------------------------------------------------------

const EfInstantContext = createContext(false);

export function EfRevealProvider({
  instant,
  children,
}: {
  instant: boolean;
  children: ReactNode;
}) {
  return (
    <EfInstantContext.Provider value={instant}>
      {children}
    </EfInstantContext.Provider>
  );
}

/**
 * Animation props for a top-level animated section. In preview mode the section
 * renders in its "visible" state immediately; otherwise it reveals on scroll.
 * Spread onto the section's `motion.*` element: `<motion.section {...reveal}>`.
 */
export function useRevealProps() {
  const instant = useContext(EfInstantContext);
  return instant
    ? ({ initial: "visible" } as const)
    : ({
        initial: "hidden",
        whileInView: "visible",
        viewport: efViewport,
      } as const);
}

/**
 * Wrap a block so it fades + rises into view (or shows immediately in preview).
 * Convenience for content that doesn't need per-child staggering.
 */
export function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  y?: number;
}) {
  const reveal = useRevealProps();
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
      }}
      {...reveal}
    >
      {children}
    </motion.div>
  );
}
