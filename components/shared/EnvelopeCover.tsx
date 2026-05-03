"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { ImageSettingsMap, TemplateTheme } from "@/lib/types";
import { getImageStyle } from "@/lib/image-settings";
import { getCoverBackgroundStyle } from "@/lib/envelope-cover-background";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvelopeCoverProps {
  theme: TemplateTheme;
  onOpen: () => void;
  onAnimationComplete?: () => void;
  /** Enable the diagonal shimmer highlight animation. Defaults to true. */
  shimmer?: boolean;
  /** Color or image URL used as the full envelope cover background. */
  coverBackground?: string;
  monogram?: string;
  /** Per-image position & zoom overrides map. */
  imageSettings?: ImageSettingsMap;
}

/* ------------------------------------------------------------------ */
/*  Timing constants (seconds)                                         */
/*  Slow cinematic feel ~5 s. Simplified without side-flaps / letter.  */
/* ------------------------------------------------------------------ */

const T = {
  /** Top flap swings open (3D rotation) */
  flapOpen: { dur: 5, del: 0 },
  bottomFlap: { dur: 15, del: 0 },
  sceneFade: { dur: 2, del: 2 },
} as const;

/** Milliseconds from tap until onAnimationComplete fires */
const TOTAL_MS = (T.flapOpen.dur - 1) * 1000;

/** Smooth ease-out bezier for a natural, gentle deceleration */
const TOP_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const BOTTOM_EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

/** Stop the flap around a natural mid-open position instead of fully flipping. */
const TOP_FLAP_OPEN_ANGLE = 40;
const TOP_FLAP_PERSPECTIVE = 1300;

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
/*  Envelope body (the back panel visible behind the flaps)            */
/* ------------------------------------------------------------------ */

function EnvelopeBody({ style }: { style: React.CSSProperties }) {
  return <div className="absolute inset-0" style={style} />;
}

/* ------------------------------------------------------------------ */
/*  Flap components                                                    */
/* ------------------------------------------------------------------ */

function TopFlap({
  opening,
  image,
  imgStyle,
}: {
  opening: boolean;
  image: string;
  imgStyle?: React.CSSProperties;
}) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{
          zIndex: 19,
          transformOrigin: "top center",
          willChange: "transform, opacity",
          opacity: 0,
          height: "calc(50% + 10vh)",
        }}
        initial={{
          opacity: 0,
          transform: topFlapShadowTransform(0, 1, 1),
        }}
        animate={
          opening
            ? {
                opacity: 1,
                transform: topFlapShadowTransform(12, 1, 1),
              }
            : {
                opacity: 0,
                transform: topFlapShadowTransform(0, 1, 1),
              }
        }
        transition={{
          duration: T.flapOpen.dur,
          delay: T.flapOpen.del,
          ease: TOP_EASE,
        }}
      >
        <Image
          src={image}
          width={500}
          height={500}
          alt=""
          className="w-full h-full object-cover object-bottom"
          style={{
            filter: "brightness(0) blur(40px)",
            opacity: 0.8,
            transform: "translateZ(0)",
            height: "calc(100%)",
            width: "100vw",
            ...imgStyle,
          }}
        />
      </motion.div>

      <motion.div
        className="absolute top-0 left-0 w-full"
        style={{
          zIndex: 20,
          transformOrigin: "top center",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          willChange: "transform",
          height: "calc(50% + 13vh)",
        }}
        initial={{
          transform: topFlapTransform(0),
        }}
        animate={
          opening
            ? {
                transform: topFlapTransform(
                  TOP_FLAP_OPEN_ANGLE,
                  -2,
                  24,
                  "-30px",
                ),
              }
            : {
                transform: topFlapTransform(0),
              }
        }
        transition={{
          duration: T.flapOpen.dur,
          delay: T.flapOpen.del,
          ease: TOP_EASE,
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
  opening,
  image,
  imgStyle,
}: {
  opening: boolean;
  image: string;
  imgStyle?: React.CSSProperties;
}) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 w-full origin-top flex items-end"
      style={{ height: "calc(50% + 12vh)" }}
      initial={{
        bottom: 0,
      }}
      animate={{
        bottom: opening ? "-9.5%" : 0,
      }}
      transition={{
        duration: T.bottomFlap.dur,
        delay: T.bottomFlap.del,
        ease: BOTTOM_EASE,
      }}
    >
      <Image
        src={image}
        width={500}
        height={500}
        alt={"Top Envelop Flap"}
        className={"w-full h-full object-cover object-top"}
        style={{ height: "calc(100% + 10vh)", ...imgStyle }}
      />
    </motion.div>
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
  coverBackground,
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
  const coverBackgroundStyle = getCoverBackgroundStyle(
    coverBackground,
    theme.envelope.base,
  );

  return (
    <motion.div
      className="absolute inset-0 z-[100] cursor-pointer overflow-hidden"
      style={{
        ...coverBackgroundStyle,
        transformStyle: "preserve-3d",
      }}
      onClick={handleTap}
      /* Exit animation: fast fade-out so there's no gap before the invitation */
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <EnvelopeBody style={coverBackgroundStyle} />

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
