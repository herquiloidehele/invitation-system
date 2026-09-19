"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { TemplateTheme } from "@/lib/types";
import { mixWithTransparent } from "@/lib/minimalism-brown";
import { useMbMotion } from "./motion";

/**
 * A bloom that travels the schedule's connector as the section scrolls.
 *
 * Progress is read from the section's own position in the viewport rather than
 * the page, so the flower starts at the first stop as the card comes into view
 * and reaches the last as it leaves — and it runs backwards when the reader
 * scrolls back up, which is what makes it feel attached to the page instead of
 * played at it.
 */
export default function TimelineBloom({
  theme,
  containerRef,
  imageUrl,
}: {
  theme: TemplateTheme;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Host's uploaded marker; the drawn bloom stands in when absent. */
  imageUrl?: string;
}) {
  const { reduced } = useMbMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 55%"],
  });

  // A spring keeps the bloom from twitching on fast flicks without lagging so
  // far behind that it stops reading as attached to the scroll.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  });

  const top = useTransform(progress, [0, 1], ["0%", "100%"]);
  const spin = useTransform(progress, [0, 1], [-18, 18]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.92, 1.06, 0.92]);

  // Under reduced motion the bloom sits at the first stop and stays there;
  // nothing animates, but the timeline still reads as intentional.
  if (reduced) {
    return (
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translate(-50%, -50%)",
          zIndex: 2,
        }}
      >
        <Bloom theme={theme} imageUrl={imageUrl} />
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top,
        x: "-50%",
        y: "-50%",
        rotate: spin,
        scale,
        zIndex: 2,
        transformOrigin: "50% 50%",
        filter: `drop-shadow(0 2px 3px ${mixWithTransparent(theme.primary, 30)})`,
      }}
    >
      <Bloom theme={theme} imageUrl={imageUrl} />
    </motion.span>
  );
}

const SIZE = 30;

function Bloom({
  theme,
  imageUrl,
}: {
  theme: TemplateTheme;
  imageUrl?: string;
}) {
  if (imageUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={imageUrl}
        width={SIZE}
        height={SIZE}
        style={{
          width: SIZE,
          height: SIZE,
          display: "block",
          objectFit: "contain",
        }}
      />
    );
  }

  // Drawn stand-in: eight petals around a centre, in theme colours, so the
  // timeline works before any artwork is dropped in — and keeps working if the
  // file is ever removed.
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 40 40"
      style={{ display: "block" }}
    >
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="12"
          rx="5.4"
          ry="8.4"
          fill={mixWithTransparent(theme.accent, 82)}
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4.6" fill={theme.accent} />
      <circle
        cx="20"
        cy="20"
        r="2.2"
        fill={mixWithTransparent(theme.primary, 70)}
      />
    </svg>
  );
}

/** Ref helper so the caller doesn't need to import the type. */
export function useTimelineRef() {
  return useRef<HTMLDivElement | null>(null);
}
