"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { ImageSettingsMap, TemplateTheme } from "@/lib/types";
import { getImageStyle } from "@/lib/image-settings";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvelopeCoverProps {
  theme: TemplateTheme;
  onOpen: () => void;
  /** Called when the full opening animation has finished playing. */
  onAnimationComplete?: () => void;
  /** Enable the diagonal shimmer highlight animation. Defaults to true. */
  shimmer?: boolean;
  /** Monogram text displayed on the envelope (passed through but unused in this component). */
  monogram?: string;
  /** Per-image position & zoom overrides map. */
  imageSettings?: ImageSettingsMap;
}

/* ------------------------------------------------------------------ */
/*  Timing constants (seconds)                                         */
/*                                                                     */
/*  Slow cinematic feel ~5 s. Simplified without side-flaps / letter.  */
/* ------------------------------------------------------------------ */

const T = {
  /** Top flap swings open (3D rotation) */
  flapOpen: { dur: 5, del: 0 },
  /** Entire scene fades to transparent */
  sceneFade: { dur: 2, del: 2 },
} as const;

/** Milliseconds from tap until onAnimationComplete fires */
const TOTAL_MS = T.flapOpen.dur * 1000;

/** Smooth ease-out bezier for a natural, gentle deceleration */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Stop the flap around a natural mid-open position instead of fully flipping. */
const TOP_FLAP_OPEN_ANGLE = 40;
const TOP_FLAP_PERSPECTIVE = 1000;

function topFlapTransform(
  rotateX: number,
  yPercent = 0,
  zPx = 0,
  ty = "0px",
): string {
  return `perspective(${TOP_FLAP_PERSPECTIVE}px) translate3d(0, ${yPercent}%, ${zPx}px) rotateX(${rotateX}deg) translateY(${ty})`;
}

function topFlapShadowTransform(yPercent = 0, scaleX = 1, scaleY = 1): string {
  return `translate3d(0, ${yPercent}%, 0) scale(${scaleX}, ${scaleY})`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Derive a shadow colour from the envelope base colour so it blends
 * naturally with any envelope hue instead of using a fixed gray.
 */
function shadowColorFromBase(hex: string, opacity = 0.65): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);

  // Darken each channel to ~25 % of the original
  const factor = 0.25;
  return `rgba(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)},${opacity})`;
}

/* ------------------------------------------------------------------ */
/*  Envelope body (the back panel visible behind the flaps)            */
/* ------------------------------------------------------------------ */

function EnvelopeBody({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: color,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Flap components                                                    */
/* ------------------------------------------------------------------ */

function TopFlap({
  opening,
  image,
  baseColor,
  imgStyle,
}: {
  opening: boolean;
  image: string;
  baseColor: string;
  imgStyle?: React.CSSProperties;
}) {
  const shadow = shadowColorFromBase(baseColor);

  return (
    <>
      <motion.div
        className="absolute top-0 left-0 w-full"
        style={{
          zIndex: 20,
          transformOrigin: "top center",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          willChange: "transform, filter",
        }}
        initial={{
          filter: `drop-shadow(0px 0px 0px rgba(17, 17, 17, 0))`,
          transform: topFlapTransform(0),
        }}
        animate={
          opening
            ? {
                filter: `drop-shadow(0px 60px 70px rgba(17, 17, 17, 1))`,
                transform: topFlapTransform(
                  TOP_FLAP_OPEN_ANGLE,
                  -2,
                  24,
                  "-20px",
                ),
              }
            : {
                filter: "drop-shadow(0px 0px 0px rgba(17, 17, 17, 0))",
                transform: topFlapTransform(0),
              }
        }
        transition={{
          duration: T.flapOpen.dur,
          delay: T.flapOpen.del,
          ease: EASE,
        }}
      >
        <Image
          src={image}
          width={500}
          height={500}
          alt={"Top Envelop Flap"}
          className={"w-full h-full object-cover object-bottom"}
          style={{
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
            ...imgStyle,
          }}
        />
      </motion.div>
    </>
  );
}

function BottomFlap({
  image,
  imgStyle,
}: {
  opening: boolean;
  image: string;
  imgStyle?: React.CSSProperties;
}) {
  return (
    <div className="absolute bottom-0 left-0 w-full origin-top">
      <Image
        src={image}
        width={500}
        height={500}
        alt={"Top Envelop Flap"}
        className={"w-full h-full object-cover object-top"}
        style={imgStyle}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EnvelopeCover({
  theme,
  onOpen,
  onAnimationComplete,
  shimmer = true,
  imageSettings,
}: EnvelopeCoverProps) {
  const [opening, setOpening] = useState(false);

  const handleTap = useCallback(() => {
    if (opening) return;
    setOpening(true);
    onOpen();
    if (onAnimationComplete) {
      setTimeout(onAnimationComplete, TOTAL_MS);
    }
  }, [opening, onOpen, onAnimationComplete]);

  const topFlapStyle = getImageStyle(imageSettings, "envelopeTopFlap");
  const bottomFlapStyle = getImageStyle(imageSettings, "envelopeBottomFlap");

  return (
    <motion.div
      className="absolute inset-0 z-[100] cursor-pointer overflow-hidden"
      style={{
        backgroundColor: theme.envelope.base,
        transformStyle: "preserve-3d",
      }}
      onClick={handleTap}
      /* Exit animation: fast fade-out so there's no gap before the invitation */
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <EnvelopeBody color={theme.envelope.base} />

      {/* Shimmer highlight — diagonal sweep across envelope */}
      {shimmer && !opening && (
        <motion.div
          className="absolute inset-0 z-[6] pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
      )}

      <TopFlap
        opening={opening}
        image={theme.envelope.topFlap}
        baseColor={theme.envelope.base}
        imgStyle={topFlapStyle}
      />

      <BottomFlap
        opening={opening}
        image={theme.envelope.bottomFlap}
        imgStyle={bottomFlapStyle}
      />

      {/* Slow opacity fade covering the last phase of the animation.
          This is the actual "scene fade" — it makes the envelope gradually
          become transparent, revealing the invitation page behind it. */}
      {opening && (
        <motion.div
          className="absolute inset-0 z-40"
          style={{ backgroundColor: theme.bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: T.sceneFade.dur,
            delay: T.sceneFade.del,
            ease: "easeIn",
          }}
        />
      )}
    </motion.div>
  );
}
