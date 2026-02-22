"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TemplateTheme } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvelopeCoverProps {
  monogram: string;
  theme: TemplateTheme;
  onOpen: () => void;
  /** Called when the full opening animation has finished playing. */
  onAnimationComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Timing constants (seconds)                                         */
/*                                                                     */
/*  Slow cinematic feel ~5 s. Simplified without side-flaps / letter.  */
/* ------------------------------------------------------------------ */

const T = {
  /** Top flap swings open (3D rotation) */
  flapOpen:   { dur: 5.4,  del: 0.2  },
  /** Wax seal cracks & dissolves */
  sealBreak:  { dur: 1.6,  del: 0.6  },
  /** Monogram fades away */
  monoFade:   { dur: 1.0,  del: 0.3  },
  /** "Toque para Abrir" fades */
  ctaFade:    { dur: 0.6,  del: 0.1  },
  /** Bottom flap drops */
  bottomDrop: { dur: 2.4,  del: 2.4  },
  /** Entire scene fades to transparent */
  sceneFade:  { dur: 0.4,  del: 3.8  },
} as const;

/** Milliseconds from tap until onAnimationComplete fires */
const TOTAL_MS = (T.sceneFade.del + T.sceneFade.dur) * 1000;

/** Smooth ease-out bezier for a natural, gentle deceleration */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Snappier ease for elements that need a bit more presence */
const EASE_OUT: [number, number, number, number] = [0.0, 0.0, 0.2, 1];

/* ------------------------------------------------------------------ */
/*  Envelope body (the back panel visible behind the flaps)            */
/* ------------------------------------------------------------------ */

function EnvelopeBody({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${brightness(color, -15)} 100%)`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Flap components                                                    */
/* ------------------------------------------------------------------ */

function TopFlap({ color, opening }: { color: string; opening: boolean }) {
  return (
    <motion.div
      className="absolute top-0 left-0 w-full origin-top"
      style={{ height: "52%", perspective: "1000px", zIndex: 20 }}
    >
      <motion.div
        className="h-full w-full origin-top"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateX: 0 }}
        animate={opening ? { rotateX: -180 } : { rotateX: 0 }}
        transition={{
          duration: T.flapOpen.dur,
          delay: T.flapOpen.del,
          ease: EASE,
        }}
      >
        {/* Front face */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 390 440"
          preserveAspectRatio="none"
          style={{ backfaceVisibility: "hidden" }}
        >
          <defs>
            <linearGradient id="tfg" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor={brightness(color, 8)} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <path d="M0 0L390 0L215 410Q195 440 175 410Z" fill="url(#tfg)" />
          <line x1="0" y1="0" x2="175" y2="410" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="390" y1="0" x2="215" y2="410" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </svg>
        {/* Back face (revealed as flap rotates open) */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 390 440"
          preserveAspectRatio="none"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          <path d="M0 0L390 0L215 410Q195 440 175 410Z" fill={brightness(color, 20)} />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function BottomFlap({ color, opening }: { color: string; opening: boolean }) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 w-full"
      style={{ height: "48%", zIndex: 10 }}
      initial={{ y: 0, opacity: 1 }}
      animate={opening ? { y: 80, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{
        duration: T.bottomDrop.dur,
        delay: T.bottomDrop.del,
        ease: EASE_OUT,
      }}
    >
      <svg className="h-full w-full" viewBox="0 0 390 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bfg" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={brightness(color, 6)} />
          </linearGradient>
        </defs>
        <path d="M0 400L390 400L215 30Q195 0 175 30Z" fill="url(#bfg)" />
      </svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wax seal                                                           */
/* ------------------------------------------------------------------ */

function WaxSeal({ opening }: { opening: boolean }) {
  return (
    <motion.div
      className="relative flex h-[125px] w-[125px] items-center justify-center overflow-hidden rounded-full"
      initial={{ scale: 1, opacity: 1, rotate: 0 }}
      animate={
        opening
          ? { scale: [1, 1.12, 1.08, 0], opacity: [1, 1, 0.8, 0], rotate: [0, -4, 6, 12] }
          : { scale: 1, opacity: 1, rotate: 0 }
      }
      transition={{ duration: T.sealBreak.dur, delay: T.sealBreak.del, ease: EASE }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/wax-seal.png"
        alt="Wax seal"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EnvelopeCover({
  monogram,
  theme,
  onOpen,
  onAnimationComplete,
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
      style={{ backgroundColor: theme.envelope.base }}
      onClick={handleTap}
      /* Exit animation: fast fade-out so there's no gap before the invitation */
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <EnvelopeBody color={brightness(theme.envelope.base, -8)} />

      <BottomFlap color={theme.envelope.bottomFlap} opening={opening} />
      <TopFlap color={theme.envelope.topFlap} opening={opening} />

      {/* Center content — monogram, seal, "Toque para Abrir" */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5" style={{ pointerEvents: "none" }}>
        <motion.span
          className="text-5xl leading-none sm:text-6xl"
          style={{
            fontFamily: theme.displayFont,
            color: theme.monogramColor,
            textShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={opening ? { opacity: 0, y: -40, scale: 0.7 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: opening ? T.monoFade.dur : 0.8,
            delay: opening ? T.monoFade.del : 0.4,
            ease: "easeOut",
          }}
        >
          {monogram}
        </motion.span>

        <WaxSeal opening={opening} />

        <motion.span
          className="text-base tracking-[0.15em]"
          style={{
            fontFamily: theme.bodyFont,
            fontStyle: "italic",
            color: theme.tapTextColor,
            textShadow: "0 1px 8px rgba(0,0,0,0.15)",
          }}
          initial={{ opacity: 0 }}
          animate={
            opening
              ? { opacity: 0, y: 20 }
              : { opacity: [0, 0.6, 1, 0.6], y: 0 }
          }
          transition={
            opening
              ? { duration: T.ctaFade.dur, delay: T.ctaFade.del }
              : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
          }
        >
          Toque para Abrir
        </motion.span>
      </div>

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

/* ------------------------------------------------------------------ */
/*  AnimatePresence wrapper (kept for backwards-compatibility)          */
/* ------------------------------------------------------------------ */

export function EnvelopeCoverAnimated({
  isOpen,
  onComplete,
  ...props
}: EnvelopeCoverProps & { isOpen: boolean; onComplete?: () => void }) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!isOpen && <EnvelopeCover key="envelope-cover" {...props} />}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function brightness(hex: string, pct: number): string {
  if (hex.startsWith("rgb")) return hex;
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + Math.round(2.55 * pct)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)));
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
