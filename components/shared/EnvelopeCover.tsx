"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";
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
/*  Stretched for a true slow-motion, cinematic feel.                  */
/*  Total sequence ≈ 5.5 s before the scene fully fades out.           */
/* ------------------------------------------------------------------ */

const T = {
  /** Top flap swings open (3D rotation) */
  flapOpen:   { dur: 2.0,  del: 0.2  },
  /** Wax seal cracks & dissolves */
  sealBreak:  { dur: 1.4,  del: 0.6  },
  /** Monogram fades away */
  monoFade:   { dur: 1.0,  del: 0.3  },
  /** "Toque para Abrir" fades */
  ctaFade:    { dur: 0.6,  del: 0.1  },
  /** Left flap folds out */
  leftFold:   { dur: 1.5,  del: 1.6  },
  /** Right flap folds out */
  rightFold:  { dur: 1.5,  del: 1.8  },
  /** Bottom flap drops */
  bottomDrop: { dur: 1.3,  del: 2.0  },
  /** Letter preview rises from inside */
  letterRise: { dur: 1.6,  del: 2.4  },
  /** Entire scene fades to transparent */
  sceneFade:  { dur: 1.2,  del: 4.2  },
} as const;

/** Milliseconds from tap until onAnimationComplete fires */
const TOTAL_MS = (T.sceneFade.del + T.sceneFade.dur) * 1000;

/** The cubic-bezier used everywhere — slow start, buttery smooth land */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
      style={{ height: "52%", perspective: "900px", zIndex: 20 }}
    >
      <motion.div
        className="h-full w-full origin-top"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateX: 0 }}
        animate={opening ? { rotateX: -180 } : { rotateX: 0 }}
        transition={{ duration: T.flapOpen.dur, delay: T.flapOpen.del, ease: EASE }}
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
          <polygon points="0,0 390,0 195,440" fill="url(#tfg)" />
          <line x1="0" y1="0" x2="195" y2="440" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="390" y1="0" x2="195" y2="440" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </svg>
        {/* Back face (revealed as flap rotates open) */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 390 440"
          preserveAspectRatio="none"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          <polygon points="0,0 390,0 195,440" fill={brightness(color, 20)} />
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
      transition={{ duration: T.bottomDrop.dur, delay: T.bottomDrop.del, ease: EASE }}
    >
      <svg className="h-full w-full" viewBox="0 0 390 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bfg" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={brightness(color, 6)} />
          </linearGradient>
        </defs>
        <polygon points="0,400 390,400 195,0" fill="url(#bfg)" />
      </svg>
    </motion.div>
  );
}

function SideFlap({
  color,
  opening,
  side,
}: {
  color: string;
  opening: boolean;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  const t = isLeft ? T.leftFold : T.rightFold;
  const rotateTarget = isLeft ? -70 : 70;
  const points = isLeft ? "0,0 210,422 0,844" : "210,0 0,422 210,844";
  const gradDir = isLeft ? { x1: "0", y1: "0.5", x2: "1", y2: "0.5" }
                         : { x1: "1", y1: "0.5", x2: "0", y2: "0.5" };
  const id = isLeft ? "lfg" : "rfg";

  return (
    <motion.div
      className={`absolute top-0 h-full ${isLeft ? "left-0 origin-left" : "right-0 origin-right"}`}
      style={{ width: "54%", zIndex: 8, perspective: "700px" }}
    >
      <motion.div
        className={`h-full w-full ${isLeft ? "origin-left" : "origin-right"}`}
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateY: 0 }}
        animate={opening ? { rotateY: rotateTarget } : { rotateY: 0 }}
        transition={{ duration: t.dur, delay: t.del, ease: EASE }}
      >
        <svg className="h-full w-full" viewBox="0 0 210 844" preserveAspectRatio="none">
          <defs>
            <linearGradient id={id} {...gradDir}>
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={brightness(color, 5)} />
            </linearGradient>
          </defs>
          <polygon points={points} fill={`url(#${id})`} />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wax seal                                                           */
/* ------------------------------------------------------------------ */

function WaxSeal({ opening }: { opening: boolean }) {
  return (
    <motion.div
      className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full"
      style={{
        background: "radial-gradient(circle at 35% 35%, #f5d675, #c9a230 50%, #a07d1c)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.3)",
      }}
      initial={{ scale: 1, opacity: 1, rotate: 0 }}
      animate={
        opening
          ? { scale: [1, 1.12, 1.08, 0], opacity: [1, 1, 0.8, 0], rotate: [0, -4, 6, 12] }
          : { scale: 1, opacity: 1, rotate: 0 }
      }
      transition={{ duration: T.sealBreak.dur, delay: T.sealBreak.del, ease: EASE }}
    >
      <div className="absolute inset-2 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.15)" }} />
      <Leaf size={40} color="rgba(255,255,255,0.85)" strokeWidth={1.2} />
      <div
        className="absolute top-2 left-3 h-6 w-10 rounded-full opacity-30"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), transparent)" }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Letter preview (rises from inside the envelope)                    */
/* ------------------------------------------------------------------ */

function LetterPreview({ theme, opening }: { theme: TemplateTheme; opening: boolean }) {
  return (
    <motion.div
      className="absolute top-[15%] right-[10%] bottom-[15%] left-[10%] rounded-lg"
      style={{
        background: theme.bg,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        zIndex: 5,
      }}
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={opening ? { y: -100, opacity: 1, scale: 1.02 } : { y: 50, opacity: 0, scale: 0.9 }}
      transition={{ duration: T.letterRise.dur, delay: T.letterRise.del, ease: EASE }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <div className="h-[2px] w-8 rounded-full" style={{ backgroundColor: theme.accent, opacity: 0.4 }} />
        <div className="h-[2px] w-20 rounded-full" style={{ backgroundColor: theme.textPrimary, opacity: 0.15 }} />
        <div className="h-[2px] w-14 rounded-full" style={{ backgroundColor: theme.textPrimary, opacity: 0.1 }} />
        <div className="mt-2 h-[2px] w-8 rounded-full" style={{ backgroundColor: theme.accent, opacity: 0.3 }} />
      </div>
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

      <LetterPreview theme={theme} opening={opening} />

      <BottomFlap color={theme.envelope.bottomFlap} opening={opening} />
      <SideFlap color={theme.envelope.leftFlap} opening={opening} side="left" />
      <SideFlap color={theme.envelope.rightFlap} opening={opening} side="right" />
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
