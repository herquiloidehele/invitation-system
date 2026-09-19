"use client";

import type { RefObject } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { TemplateTheme } from "@/lib/types";
import { mixWithTransparent } from "@/lib/minimalism-brown";
import { useMbMotion } from "./motion";

/**
 * The connector line behind the stops, filling as the reader scrolls.
 *
 * Drawn as one continuous element spanning the whole list rather than a
 * segment per row: a per-row line can't show progress that runs between rows,
 * and the seams show at fractional pixel heights.
 */
export default function TimelineTrack({
  theme,
  containerRef,
}: {
  theme: TemplateTheme;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const { reduced } = useMbMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 55%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  });
  const scaleY = useTransform(progress, [0, 1], [0, 1]);

  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        bottom: 0,
        width: 1,
        transform: "translateX(-50%)",
        backgroundColor: mixWithTransparent(theme.primary, 22),
      }}
    >
      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: theme.primary,
          transformOrigin: "50% 0%",
          // Reduced motion gets the full line, not an empty one — the track
          // should never look broken just because it isn't animating.
          scaleY: reduced ? 1 : scaleY,
        }}
      />
    </span>
  );
}
