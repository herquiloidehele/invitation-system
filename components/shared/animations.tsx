"use client";

/**
 * Shared animation primitives for invitation page sections.
 *
 * Centralised here so multiple section components (InvitationPage,
 * ScheduleSection, SaveTheDateSection, …) can share the same easing,
 * variants, and helper components.
 */

import { motion, type Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ---------------------------------------------------------------------------
// Stagger containers
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const quickStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// ---------------------------------------------------------------------------
// Word reveal — for section titles & key labels
// ---------------------------------------------------------------------------

export const wordContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const wordChild: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
};

// ---------------------------------------------------------------------------
// Entrance variants
// ---------------------------------------------------------------------------

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: EASE },
  },
};

// ---------------------------------------------------------------------------
// Continuous ambient loops
// ---------------------------------------------------------------------------

export const breatheAnimation = {
  scale: [1, 1.06, 1],
  transition: {
    duration: 3.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export const floatAnimation = {
  y: [0, -3, 0],
  transition: {
    duration: 4.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export const pulseDot = {
  scale: [1, 1.4, 1],
  opacity: [0.6, 1, 0.6],
  transition: {
    duration: 2.6,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// ---------------------------------------------------------------------------
// Hover lift
// ---------------------------------------------------------------------------

export const liftCardProps = {
  whileHover: {
    y: -3,
    transition: { duration: 0.25, ease: EASE },
  },
} as const;

// ---------------------------------------------------------------------------
// WordReveal component
// ---------------------------------------------------------------------------

export function WordReveal({
  text,
  isPreview,
  className,
  style,
}: {
  text: string;
  isPreview?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const lines = text.split("\n");
  return (
    <motion.span
      variants={wordContainer}
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: false, margin: "-40px" },
          })}
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      {lines.map((line, li) => {
        const words = line.split(" ");
        return (
          <span key={li} style={{ display: "block" }}>
            {words.map((word, wi) => (
              <motion.span
                key={wi}
                variants={wordChild}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                }}
              >
                {word}
                {wi < words.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </span>
        );
      })}
    </motion.span>
  );
}
