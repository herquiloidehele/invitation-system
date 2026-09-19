"use client";

import type { CSSProperties, RefObject } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import type { TemplateTheme } from "@/lib/types";

/**
 * A rail that fills as a section scrolls past, with a marker riding it.
 *
 * Render it inside a caller-positioned absolute box — the rail fills that box,
 * so each template decides where the line sits (a column gutter, a margin)
 * without this component knowing anything about the surrounding layout.
 *
 * Progress comes from the section's own position in the viewport, so the
 * marker runs backwards when the reader scrolls back up. Everything that moves
 * reads the same progress value: separate observers per element would let the
 * marker and the fill disagree about where "here" is.
 */
export default function ScrollTimeline({
  containerRef,
  theme,
  markerImageUrl,
  markerSize = 30,
  offset = ["start 85%", "end 55%"],
}: {
  /** The element whose scroll position drives the fill. */
  containerRef: RefObject<HTMLElement | null>;
  theme: TemplateTheme;
  /** Host's own marker; a drawn bloom in theme colours stands in when absent. */
  markerImageUrl?: string;
  markerSize?: number;
  /** framer-motion scroll offset, if a section needs a different window. */
  offset?: [string, string];
}) {
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // framer's types are stricter than its runtime here; the tuple above is a
    // valid offset pair.
    offset: offset as never,
  });

  // A spring smooths fast flicks without lagging far enough behind to stop
  // reading as attached to the scroll.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  });

  const scaleY = useTransform(progress, [0, 1], [0, 1]);
  const top = useTransform(progress, [0, 1], ["0%", "100%"]);
  const spin = useTransform(progress, [0, 1], [-18, 18]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.92, 1.06, 0.92]);

  const rail: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    transform: "translateX(-50%)",
    backgroundColor: mix(theme.primary, 22),
  };

  return (
    <>
      <span aria-hidden style={rail}>
        <motion.span
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: theme.primary,
            transformOrigin: "50% 0%",
            // Reduced motion gets the whole line rather than an empty one —
            // the rail should never look broken just because it isn't moving.
            scaleY: reduced ? 1 : scaleY,
          }}
        />
      </span>

      {reduced ? (
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
          <Marker
            theme={theme}
            imageUrl={markerImageUrl}
            size={markerSize}
          />
        </span>
      ) : (
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
            filter: `drop-shadow(0 2px 3px ${mix(theme.primary, 30)})`,
          }}
        >
          <Marker
            theme={theme}
            imageUrl={markerImageUrl}
            size={markerSize}
          />
        </motion.span>
      )}
    </>
  );
}

/** A themed colour faded toward transparency. */
function mix(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

function Marker({
  theme,
  imageUrl,
  size,
}: {
  theme: TemplateTheme;
  imageUrl?: string;
  size: number;
}) {
  if (imageUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={imageUrl}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          display: "block",
          objectFit: "contain",
        }}
      />
    );
  }

  // Drawn stand-in: eight petals around a centre, in theme colours, so the
  // timeline works with no artwork at all — and keeps working if a host's
  // uploaded file is ever removed.
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="12"
          rx="5.4"
          ry="8.4"
          fill={mix(theme.accent, 82)}
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4.6" fill={theme.accent} />
      <circle cx="20" cy="20" r="2.2" fill={mix(theme.primary, 70)} />
    </svg>
  );
}
