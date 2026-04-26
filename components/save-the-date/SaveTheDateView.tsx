"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle } from "lucide-react";
import type { SaveTheDateData } from "@/lib/save-the-date";
import type { TemplateTheme } from "@/lib/types";
import { getSaveTheDateEnvelopeCoverBackground } from "@/lib/save-the-date-envelope";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import ScratchHeart from "./ScratchHeart";
import DateReveal from "./DateReveal";
import CalendarButton from "./CalendarButton";
import SaveTheDateBottomHero from "./SaveTheDateBottomHero";
import RSVPModal from "@/components/shared/RSVPModal";
import { useDynamicFonts } from "@/hooks/useDynamicFont";
import { EditableText } from "@/components/shared/EditableText";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";

interface SaveTheDateViewProps {
  saveTheDate: SaveTheDateData;
  hideEnvelope?: boolean;
}

const HEART_SIZE = 280;

// ---------------------------------------------------------------------------
// Premium ease — expo-out curve, feels elegant and intentional
// ---------------------------------------------------------------------------
const EASE = [0.22, 1, 0.36, 1] as const;

// ---------------------------------------------------------------------------
// A. Entrance stagger container — orchestrates top-to-bottom cascade
// ---------------------------------------------------------------------------
const entranceContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.22, delayChildren: 0.1 },
  },
};

// Individual entrance items
const fadeDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE } },
};

const hintFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5, transition: { duration: 0.8, ease: EASE } },
};

// D. Hint exit animation
const hintExit: Variants = {
  exit: { opacity: 0, y: -10, transition: { duration: 0.4, ease: EASE } },
};

// C. Post-reveal items — triggered when revealed becomes true
const revealFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const revealContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

// B. Heart breathing pulse
const heartPulse: Variants = {
  pulse: {
    scale: [1, 1.03, 1],
    transition: { duration: 2.5, ease: "easeInOut", repeat: Infinity },
  },
  still: { scale: 1 },
};

export default function SaveTheDateView({
  saveTheDate,
  hideEnvelope = false,
}: SaveTheDateViewProps) {
  const {
    couple,
    date,
    customMessage,
    theme,
    textStyles,
    rsvp,
    audio,
    bottomHero,
  } = saveTheDate;
  const rsvpEnabled = rsvp?.enabled === true;
  const [revealed, setRevealed] = useState(false);
  const [envelopeDone, setEnvelopeDone] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(() => {
    if (!rsvpEnabled || typeof window === "undefined") return false;
    try {
      const slugs: string[] = JSON.parse(
        window.localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
      );
      return slugs.includes(saveTheDate.slug);
    } catch {
      return false;
    }
  });

  // Audio refs (same pattern as InvitationView)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasAudio = audio.enabled && !!audio.src && Boolean(theme.envelope);

  const handleRsvpClose = useCallback(() => {
    // Re-check localStorage in case the modal wrote a new submission
    try {
      const slugs: string[] = JSON.parse(
        localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
      );
      if (slugs.includes(saveTheDate.slug)) setRsvpSubmitted(true);
    } catch {
      // ignore
    }
    setRsvpOpen(false);
  }, [saveTheDate.slug]);

  // Element-level overrides from the shared TextStyleOverrides system
  const titleOverride = textStyles?.elements?.stdTitle;
  const coupleOverride = textStyles?.elements?.stdCoupleNames;
  const hintOverride = textStyles?.elements?.stdHint;
  const dateOverride = textStyles?.elements?.stdDate;
  const dateLabelOverride = textStyles?.elements?.stdDateLabel;
  const customMessageOverride = textStyles?.elements?.stdCustomMessage;

  // Resolve fonts — element override wins, fall back to theme
  const resolvedTitleFont = titleOverride?.fontFamily ?? theme.titleFont;
  const resolvedCoupleFont = coupleOverride?.fontFamily ?? theme.coupleFont;
  const resolvedHintFont = hintOverride?.fontFamily ?? theme.coupleFont;
  const resolvedDateFont = dateOverride?.fontFamily ?? theme.dateFont;
  const resolvedDateLabelFont = dateLabelOverride?.fontFamily ?? theme.dateFont;
  const resolvedCustomMessageFont =
    customMessageOverride?.fontFamily ?? theme.dateFont;

  // Load any custom Google Fonts that were overridden
  useDynamicFonts([
    titleOverride?.fontFamily ?? null,
    coupleOverride?.fontFamily ?? null,
    hintOverride?.fontFamily ?? null,
    dateOverride?.fontFamily ?? null,
    dateLabelOverride?.fontFamily ?? null,
    customMessageOverride?.fontFamily ?? null,
  ]);

  // Determine if this STD has an envelope configured
  const hasEnvelope = Boolean(theme.envelope);

  // Build a minimal TemplateTheme-compatible object for EnvelopeCover
  const envelopeTheme = useMemo(() => {
    if (!theme.envelope) return null;
    const env = theme.envelope;
    const overrides = saveTheDate.envelope;
    return {
      envelope: {
        base: overrides?.base || env.base,
        topFlap: overrides?.topFlap || env.topFlap,
        bottomFlap: overrides?.bottomFlap || env.bottomFlap,
      },
      bg: theme.bgColor,
    } as TemplateTheme;
  }, [theme.envelope, theme.bgColor, saveTheDate.envelope]);

  const coverBackground = theme.envelope
    ? getSaveTheDateEnvelopeCoverBackground(
        theme.envelope,
        saveTheDate.envelope,
      )
    : undefined;

  const shimmer = saveTheDate.envelope?.shimmer !== false;

  // Track page view
  useEffect(() => {
    fetch("/api/save-the-date/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: saveTheDate.slug, type: "page_view" }),
    }).catch(() => {});
  }, [saveTheDate.slug]);

  // Pause audio when tab is hidden; resume on return
  useEffect(() => {
    let wasPlayingBeforeHide = false;
    const handleVisibilityChange = () => {
      const el = audioRef.current;
      if (!el) return;
      if (document.hidden) {
        wasPlayingBeforeHide = !el.paused;
        if (wasPlayingBeforeHide) el.pause();
      } else {
        if (wasPlayingBeforeHide) el.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const handleEnvelopeOpen = useCallback(() => {
    fetch("/api/save-the-date/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: saveTheDate.slug, type: "envelope_open" }),
    }).catch(() => {});

    // Start music with cinematic volume fade-in (same as InvitationView)
    if (hasAudio) {
      try {
        const el = audioRef.current;
        if (!el) return;
        el.loop = true;
        el.volume = 0.03;
        el.play()
          .then(() => {
            let vol = 0.03;
            const fade = setInterval(() => {
              vol = Math.min(vol + 0.02, 0.5);
              el.volume = vol;
              if (vol >= 0.5) clearInterval(fade);
            }, 200);
            fadeIntervalRef.current = fade;
          })
          .catch(() => {});
      } catch {
        /* silent */
      }
    }
  }, [saveTheDate.slug, hasAudio]);

  const handleEnvelopeDone = useCallback(() => {
    setEnvelopeDone(true);
  }, []);

  const handleReveal = useCallback(() => {
    setRevealed(true);

    fetch("/api/save-the-date/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: saveTheDate.slug, type: "heart_scratched" }),
    }).catch(() => {});

    const colors = theme.confettiColors;
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.4,
      decay: 0.94,
      startVelocity: 20,
      colors,
      scalar: 1.2,
    };

    confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.45 } });
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 60,
        spread: 200,
        origin: { x: 0.4, y: 0.5 },
      });
    }, 150);
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 60,
        spread: 200,
        origin: { x: 0.6, y: 0.5 },
      });
    }, 300);
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 40,
        spread: 300,
        origin: { x: 0.5, y: 0.4 },
        startVelocity: 30,
      });
    }, 500);
  }, [theme.confettiColors, saveTheDate.slug]);

  const showBottomHero = bottomHero?.enabled && !!bottomHero.mediaUrl;

  return (
    <div className="relative" style={{ backgroundColor: theme.bgColor }}>
      <div
        className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 max-w-125 mx-auto"
        style={{ backgroundColor: theme.bgColor }}
      >
        {/* Hidden pre-buffered audio element */}
        {hasAudio && (
          <audio
            ref={audioRef}
            src={audio.src}
            preload="auto"
            aria-hidden
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Envelope overlay */}
        <AnimatePresence>
          {!hideEnvelope && hasEnvelope && envelopeTheme && !envelopeDone && (
            <EnvelopeCover
              key="envelope"
              theme={envelopeTheme}
              coverBackground={coverBackground}
              onOpen={handleEnvelopeOpen}
              onAnimationComplete={handleEnvelopeDone}
              shimmer={shimmer}
            />
          )}
        </AnimatePresence>

        {/* ── A. Entrance stagger container ────────────────────────── */}
        <motion.div
          className="flex flex-col items-center"
          variants={entranceContainer}
          initial="hidden"
          animate={
            hideEnvelope || envelopeDone || !hasEnvelope ? "visible" : "hidden"
          }
        >
          {/* Title — fades down from above */}
          <motion.h1
            variants={fadeDown}
            className="mb-8 text-4xl"
            style={{
              fontFamily: resolvedTitleFont,
              color: titleOverride?.color ?? theme.textColor,
              ...(titleOverride?.fontSize
                ? { fontSize: titleOverride.fontSize }
                : {}),
              ...(titleOverride?.fontWeight
                ? { fontWeight: titleOverride.fontWeight }
                : {}),
              ...(titleOverride?.letterSpacing
                ? { letterSpacing: titleOverride.letterSpacing }
                : {}),
            }}
          >
            <EditableText elementKey="stdTitle">Save the Date</EditableText>
          </motion.h1>

          {/* D. Hint text — fades in, then exits gracefully on reveal */}
          <AnimatePresence>
            {!revealed && (
              <motion.p
                key="hint"
                variants={{ ...hintFade, ...hintExit }}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs tracking-widest uppercase"
                style={{
                  fontFamily: resolvedHintFont,
                  color: hintOverride?.color ?? theme.textColor,
                  ...(hintOverride?.fontSize
                    ? { fontSize: hintOverride.fontSize }
                    : {}),
                  ...(hintOverride?.fontWeight
                    ? { fontWeight: hintOverride.fontWeight }
                    : {}),
                  ...(hintOverride?.letterSpacing
                    ? { letterSpacing: hintOverride.letterSpacing }
                    : {}),
                }}
              >
                <EditableText elementKey="stdHint">
                  Raspe para ver a data
                </EditableText>
              </motion.p>
            )}
          </AnimatePresence>

          {/* B. Heart — scales in, then pulses while waiting for scratch */}
          <motion.div variants={scaleIn} className={"mt-5 mb-8"}>
            <motion.div
              variants={heartPulse}
              animate={revealed ? "still" : "pulse"}
            >
              <ScratchHeart
                width={HEART_SIZE}
                height={HEART_SIZE}
                heartColor={theme.heartColor}
                glitterColors={theme.heartGlitterColors}
                textureUrl={theme.heartTextureUrl}
                onReveal={handleReveal}
                forceReveal={hideEnvelope}
              >
                <DateReveal
                  date={date}
                  theme={theme}
                  dateOverride={dateOverride}
                  dateLabelOverride={dateLabelOverride}
                  resolvedDateFont={resolvedDateFont}
                  resolvedDateLabelFont={resolvedDateLabelFont}
                  revealed={revealed}
                  forceReveal
                />
              </ScratchHeart>
            </motion.div>
          </motion.div>

          {/* E. Couple names — split into bride / & / groom, staggered */}
          <motion.h2
            variants={fadeUp}
            className="text-2xl font-light uppercase flex items-baseline gap-[0.3em] mb-6"
            style={{
              fontFamily: resolvedCoupleFont,
              color: coupleOverride?.color ?? theme.textColor,
              letterSpacing: coupleOverride?.letterSpacing ?? "0.15em",
              ...(coupleOverride?.fontSize
                ? { fontSize: coupleOverride.fontSize }
                : {}),
              ...(coupleOverride?.fontWeight
                ? { fontWeight: coupleOverride.fontWeight }
                : {}),
            }}
          >
            <EditableText elementKey="stdCoupleNames">
              <motion.span
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
              >
                {couple.bride}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ duration: 0.7, delay: 1.0, ease: EASE }}
                className="text-[0.7em]"
              >
                &amp;
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
              >
                {couple.groom}
              </motion.span>
            </EditableText>
          </motion.h2>
        </motion.div>

        {/* ── C. Post-reveal choreography ──────────────────────────── */}
        <AnimatePresence>
          <motion.div
            className="flex flex-col items-center w-full"
            variants={revealContainer}
            initial="hidden"
            animate={revealed ? "visible" : "hidden"}
            style={{ visibility: revealed ? "visible" : "hidden" }}
          >
            {/* Custom message */}
            {customMessage && (
              <motion.p
                variants={revealFadeUp}
                className="text-sm tracking-wide"
                style={{
                  fontFamily: resolvedCustomMessageFont,
                  color: customMessageOverride?.color ?? theme.textColor,
                  opacity: 0.6,
                  ...(customMessageOverride?.fontSize
                    ? { fontSize: customMessageOverride.fontSize }
                    : {}),
                  ...(customMessageOverride?.fontWeight
                    ? { fontWeight: customMessageOverride.fontWeight }
                    : {}),
                  ...(customMessageOverride?.letterSpacing
                    ? { letterSpacing: customMessageOverride.letterSpacing }
                    : {}),
                }}
              >
                <EditableText elementKey="stdCustomMessage">
                  {customMessage}
                </EditableText>
              </motion.p>
            )}

            {/* RSVP / Calendar button */}
            <motion.div
              variants={revealFadeUp}
              className="mt-8 w-full max-w-xs flex flex-col gap-3"
            >
              {rsvpEnabled && (
                <button
                  onClick={() => !rsvpSubmitted && setRsvpOpen(true)}
                  disabled={rsvpSubmitted}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95 disabled:cursor-default disabled:active:scale-100"
                  style={{
                    background: rsvpSubmitted
                      ? "#22c55e"
                      : `linear-gradient(135deg, ${theme.heartColor}, ${theme.heartGlitterColors[0] || theme.heartColor})`,
                    color: "#FFFFFF",
                    fontFamily: theme.coupleFont,
                  }}
                >
                  {rsvpSubmitted ? (
                    <>
                      <CheckCircle size={16} />
                      Presença Confirmada
                    </>
                  ) : (
                    "Confirmar Presença"
                  )}
                </button>
              )}
              {!rsvpEnabled && (
                <CalendarButton
                  date={date}
                  couple={couple}
                  theme={theme}
                  visible
                />
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* RSVP Modal */}
        {rsvpEnabled && (
          <RSVPModal
            isOpen={rsvpOpen}
            onClose={handleRsvpClose}
            invitationSlug={saveTheDate.slug}
            apiEndpoint="/api/save-the-date/rsvp"
            slugKey="saveTheDateSlug"
            theme={{
              bg: theme.bgColor,
              cardBg: "#FFFFFF",
              primary: theme.heartColor,
              textPrimary: "#323232",
              textSecondary: "#6B6B6B",
              textMuted: "#A0A0A0",
              accent: theme.heartColor,
              ctaPrimaryBg: `linear-gradient(135deg, ${theme.heartColor}, ${theme.heartGlitterColors[0] || theme.heartColor})`,
              ctaPrimaryText: "#FFFFFF",
              ctaRadius: "9999px",
              cardBorder: "#E5E5E3",
              bodyFont: theme.coupleFont,
            }}
          />
        )}
      </div>

      {/* Bottom hero section */}
      {showBottomHero && (hideEnvelope || envelopeDone) && (
        <SaveTheDateBottomHero
          config={bottomHero}
          theme={theme}
          textStyles={textStyles}
          isPreview={hideEnvelope}
        />
      )}
    </div>
  );
}
