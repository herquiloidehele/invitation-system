"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TemplateTheme } from "@/lib/types";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvelopeCoverProps {
  theme: TemplateTheme;
  onOpen: () => void;
  /** Called when the full opening animation has finished playing. */
  onAnimationComplete?: () => void;
  /** Couple monogram to display on the envelope face (e.g. "A&M") */
  monogram?: string;
}

/* ------------------------------------------------------------------ */
/*  Timing constants (seconds)                                         */
/*                                                                     */
/*  Slow cinematic feel ~5 s. Simplified without side-flaps / letter.  */
/* ------------------------------------------------------------------ */

const T = {
  /** Top flap swings open (3D rotation) */
  flapOpen:   { dur: 10,  del: 1  },
  /** Bottom flap drops */
  bottomDrop: { dur: 10,  del: 2  },
  /** Entire scene fades to transparent */
  sceneFade:  { dur: 2,  del: 3  },
} as const;

/** Milliseconds from tap until onAnimationComplete fires */
const TOTAL_MS = (T.flapOpen.dur - 5) * 1000;

/** Smooth ease-out bezier for a natural, gentle deceleration */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

function TopFlap({ opening, image }: { opening: boolean; image: string  }) {
  return (
    <motion.div
      className="absolute top-0 left-0 w-full origin-bottom"
      style={{ zIndex: 10 }}
      initial={{  filter: "drop-shadow(0 0 0 transparent)", transform: "scale(1) translateY(0)" }}
      animate={
        opening
          && { filter: "drop-shadow(0 50px 90px #7f7f7f)", y: "-100%", transform: "scale(1.15) translateY(-25%)" }

      }
      transition={{
        duration: T.flapOpen.dur,
        delay: T.flapOpen.del,
        ease: EASE,
      }}
    >
      <Image src={image} width={500} height={500} alt={"Top Envelop Flap"} className={"w-full h-auto"} />
    </motion.div>
  );
}

function BottomFlap({ image }: { opening: boolean, image: string }) {
  return (
    <div
      className="absolute bottom-0 left-0 w-full origin-top"
    >
      <Image src={image} width={500} height={500} alt={"Top Envelop Flap"} className={"w-full h-auto"} />
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
  monogram,
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

  return (
    <motion.div
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden"
      style={{ backgroundColor: theme.envelope.base, perspective: "1200px" }}
      onClick={handleTap}
      /* Exit animation: fast fade-out so there's no gap before the invitation */
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <EnvelopeBody color={theme.envelope.base} />

      {/* Monogram + tap prompt — centered on the envelope face */}
      {!opening && (
        <motion.div
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 pointer-events-none"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          {monogram && (
            <span
              className="text-4xl font-light tracking-widest"
              style={{
                fontFamily: theme.displayFont,
                color: theme.monogramColor,
                textShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              {monogram}
            </span>
          )}
          <motion.span
            className="text-xs font-medium uppercase tracking-[0.2em]"
            style={{
              fontFamily: theme.uiFont,
              color: theme.tapTextColor,
              opacity: 0.7,
            }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Toque para abrir
          </motion.span>
        </motion.div>
      )}

      {/* Shimmer highlight — diagonal sweep across envelope */}
      {!opening && (
        <motion.div
          className="absolute inset-0 z-[6] pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        />
      )}

      <BottomFlap opening={opening} image={theme.envelope.bottomFlap} />
      <TopFlap opening={opening} image={theme.envelope.topFlap}  />

      {/* Slow opacity fade covering the last phase of the animation.
          This is the actual "scene fade" — it makes the envelope gradually
          become transparent, revealing the invitation page behind it. */}
      {opening && (
        <motion.div
          className="absolute inset-0 z-40"
          style={{ backgroundColor: theme.bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.sceneFade.dur, delay: T.sceneFade.del, ease: "easeIn" }}
        />
      )}
    </motion.div>
  );
}

