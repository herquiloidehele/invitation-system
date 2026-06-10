"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle } from "lucide-react";
import type { SaveTheDateData } from "@/lib/save-the-date";
import type { TemplateTheme } from "@/lib/types";
import { getSaveTheDateEnvelopeCoverBackground } from "@/lib/save-the-date-envelope";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import LocationCard from "@/components/shared/LocationCard";
import ScratchHeart from "./ScratchHeart";
import DateReveal from "./DateReveal";
import CalendarButton from "./CalendarButton";
import SaveTheDateBottomHero from "./SaveTheDateBottomHero";
import RSVPModal from "@/components/shared/RSVPModal";
import { useDynamicFonts } from "@/hooks/useDynamicFont";
import { EditableText } from "@/components/shared/EditableText";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { getSaveTheDateSparkles } from "@/lib/save-the-date-motion";
import {
  getSaveTheDateLocationTextStyles,
  getSaveTheDateLocationTheme,
} from "@/lib/save-the-date-location-theme";
import { getSaveTheDateRsvpButtonBackground } from "@/lib/save-the-date-rsvp-button";
import {
  getRsvpCustomFields,
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
} from "@/lib/rsvp-config";

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
  hidden: { opacity: 0, y: -28, scale: 0.96, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1, ease: EASE },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1, ease: EASE },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.86, rotate: -3 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

const hintFade: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 0.62, y: 0, transition: { duration: 0.8, ease: EASE } },
};

// D. Hint exit animation
const hintExit: Variants = {
  exit: { opacity: 0, y: -10, transition: { duration: 0.4, ease: EASE } },
};

// C. Post-reveal items — triggered when revealed becomes true
const revealFadeUp: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  },
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
    scale: [1, 1.035, 1],
    rotate: [0, -0.8, 0.8, 0],
    transition: { duration: 2.7, ease: "easeInOut", repeat: Infinity },
  },
  still: { scale: 1, rotate: 0 },
};

const sparkleFloat: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: [0, 0.85, 0.25, 0.85],
    scale: [0.4, 1, 0.75, 1],
    y: [0, -12, 0],
  },
};

const revealSparkle: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 6 },
  visible: {
    opacity: [0, 1, 0],
    scale: [0.4, 1.35, 0.8],
    y: [6, -18, -26],
    transition: { duration: 1.3, ease: EASE },
  },
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
  const [revealed, setRevealed] = useState(hideEnvelope);
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
  const shouldReduceMotion = useReducedMotion();
  const sparkles = useMemo(() => getSaveTheDateSparkles(), []);

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
  const sectionTitleOverride = textStyles?.elements?.sectionTitles;
  const locationNameOverride = textStyles?.elements?.locationName;
  const locationAddressOverride = textStyles?.elements?.locationAddress;

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
    sectionTitleOverride?.fontFamily ?? null,
    locationNameOverride?.fontFamily ?? null,
    locationAddressOverride?.fontFamily ?? null,
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
  const rsvpButtonBackground = getSaveTheDateRsvpButtonBackground(theme);
  const locationTheme = useMemo(
    () => getSaveTheDateLocationTheme(theme),
    [theme],
  );
  const locationTextStyles = useMemo(
    () => getSaveTheDateLocationTextStyles(theme, textStyles),
    [theme, textStyles],
  );

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

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial="hidden"
          animate={
            !shouldReduceMotion &&
            (hideEnvelope || envelopeDone || !hasEnvelope)
              ? "visible"
              : "hidden"
          }
        >
          {sparkles.map((sparkle, index) => (
            <motion.span
              key={`${sparkle.top}-${sparkle.left}`}
              variants={sparkleFloat}
              className="absolute rounded-full"
              style={{
                top: sparkle.top,
                left: sparkle.left,
                width: sparkle.size,
                height: sparkle.size,
                backgroundColor:
                  theme.heartGlitterColors[
                    index % theme.heartGlitterColors.length
                  ] ?? theme.heartColor,
                boxShadow: `0 0 ${sparkle.size * 4}px ${theme.heartGlitterColors[index % theme.heartGlitterColors.length] ?? theme.heartColor}`,
              }}
              transition={{
                delay: sparkle.delay,
                duration: sparkle.duration,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
          ))}
        </motion.div>

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
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 1.03,
                    textShadow: `0 0 18px ${theme.heartColor}66`,
                  }
            }
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
                animate={
                  shouldReduceMotion
                    ? "visible"
                    : {
                        opacity: [0.45, 0.75, 0.45],
                        y: [0, -4, 0],
                      }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: {
                          duration: 2.4,
                          ease: "easeInOut",
                          repeat: Infinity,
                        },
                        y: {
                          duration: 2.4,
                          ease: "easeInOut",
                          repeat: Infinity,
                        },
                      }
                }
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
          <motion.div variants={scaleIn} className="relative mt-5 mb-8">
            <motion.div
              aria-hidden
              className="absolute inset-8 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle, ${theme.heartColor}45 0%, ${theme.heartColor}16 42%, transparent 72%)`,
              }}
              animate={
                shouldReduceMotion || revealed
                  ? { opacity: 0.35, scale: 1 }
                  : { opacity: [0.28, 0.62, 0.28], scale: [0.92, 1.08, 0.92] }
              }
              transition={{
                duration: 2.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            <motion.div
              variants={heartPulse}
              animate={shouldReduceMotion || revealed ? "still" : "pulse"}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.045 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
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
            <AnimatePresence>
              {revealed && !shouldReduceMotion && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-20"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <motion.span
                      key={item}
                      variants={revealSparkle}
                      className="absolute rounded-full"
                      style={{
                        top: `${24 + (item % 3) * 20}%`,
                        left: `${24 + item * 9}%`,
                        width: 6,
                        height: 6,
                        backgroundColor:
                          theme.heartGlitterColors[
                            item % theme.heartGlitterColors.length
                          ] ?? theme.heartColor,
                        boxShadow: `0 0 18px ${theme.heartColor}`,
                      }}
                      transition={{
                        delay: item * 0.08,
                        duration: 1.1,
                        ease: EASE,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* E. Couple names — split into bride / & / groom, staggered */}
          <motion.h2
            variants={fadeUp}
            className="text-2xl font-light flex items-baseline gap-[0.3em] mb-6"
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
                animate={{
                  opacity: 1,
                  x: 0,
                  y: revealed && !shouldReduceMotion ? [0, -3, 0] : 0,
                }}
                transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
              >
                {couple.bride}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity:
                    revealed && !shouldReduceMotion ? [0.6, 1, 0.6] : 0.6,
                  scale: revealed && !shouldReduceMotion ? [1, 1.2, 1] : 1,
                  rotate: revealed && !shouldReduceMotion ? [0, -8, 8, 0] : 0,
                }}
                transition={{ duration: 0.7, delay: 1.0, ease: EASE }}
                className="text-[0.7em]"
              >
                &amp;
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 12 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: revealed && !shouldReduceMotion ? [0, -3, 0] : 0,
                }}
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
                className="text-sm tracking-wide text-center"
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
                <motion.button
                  onClick={() => !rsvpSubmitted && setRsvpOpen(true)}
                  disabled={rsvpSubmitted}
                  whileHover={
                    shouldReduceMotion || rsvpSubmitted
                      ? undefined
                      : {
                          y: -2,
                          boxShadow: `0 14px 34px ${rsvpButtonBackground}45`,
                        }
                  }
                  whileTap={
                    shouldReduceMotion || rsvpSubmitted
                      ? undefined
                      : { scale: 0.96 }
                  }
                  animate={
                    rsvpSubmitted && !shouldReduceMotion
                      ? { scale: [1, 1.04, 1] }
                      : undefined
                  }
                  transition={{ duration: 0.45, ease: EASE }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95 disabled:cursor-default disabled:active:scale-100"
                  style={{
                    background: rsvpSubmitted
                      ? "#22c55e"
                      : rsvpButtonBackground,
                    color: "#FFFFFF",
                    fontFamily: theme.coupleFont,
                  }}
                >
                  {rsvpSubmitted ? (
                    <>
                      <motion.span
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : { rotate: [0, -12, 12, 0] }
                        }
                        transition={{ duration: 0.5, ease: EASE }}
                      >
                        <CheckCircle size={16} />
                      </motion.span>
                      Presença Confirmada
                    </>
                  ) : (
                    "Confirmar Presença"
                  )}
                </motion.button>
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
            showEmail={shouldShowRsvpEmail(saveTheDate.rsvp)}
            showDietaryRestrictions={shouldShowRsvpDietaryRestrictions(
              saveTheDate.rsvp,
            )}
            customFields={getRsvpCustomFields(saveTheDate.rsvp)}
            theme={{
              bg: theme.bgColor,
              cardBg: "#FFFFFF",
              primary: theme.heartColor,
              textPrimary: "#323232",
              textSecondary: "#6B6B6B",
              textMuted: "#A0A0A0",
              accent: theme.heartColor,
              ctaPrimaryBg: rsvpButtonBackground,
              ctaPrimaryText: "#FFFFFF",
              ctaRadius: "9999px",
              cardBorder: "#E5E5E3",
              bodyFont: theme.coupleFont,
            }}
          />
        )}
      </div>

      {saveTheDate.location && (hideEnvelope || envelopeDone) && (
        <section className="mx-auto w-full max-w-md px-6 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-5 text-center"
          >
            <EditableText elementKey="sectionTitles">
              <p
                className="text-xs uppercase tracking-[0.32em]"
                style={locationTextStyles.sectionTitles}
              >
                Localização
              </p>
            </EditableText>
          </motion.div>
          <LocationCard
            location={saveTheDate.location}
            theme={locationTheme}
            ts={locationTextStyles}
          />
          {saveTheDate.location2 && (
            <div className="mt-4">
              <LocationCard
                location={saveTheDate.location2}
                theme={locationTheme}
                ts={locationTextStyles}
              />
            </div>
          )}
        </section>
      )}

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
