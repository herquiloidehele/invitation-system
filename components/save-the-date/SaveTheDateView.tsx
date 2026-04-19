"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle } from "lucide-react";
import type { SaveTheDateData } from "@/lib/save-the-date";
import type { TemplateTheme } from "@/lib/types";
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

export default function SaveTheDateView({
  saveTheDate,
  hideEnvelope = false,
}: SaveTheDateViewProps) {
  const { couple, date, customMessage, theme, textStyles, rsvp, audio, bottomHero } = saveTheDate;
  const [revealed, setRevealed] = useState(false);
  const [envelopeDone, setEnvelopeDone] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Audio refs (same pattern as InvitationView)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasAudio =
    audio.enabled && !!audio.src && Boolean(theme.envelope);

  const rsvpEnabled = rsvp?.enabled === true;

  // Check localStorage on mount for already-submitted state
  useEffect(() => {
    if (!rsvpEnabled) return;
    try {
      const slugs: string[] = JSON.parse(
        localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
      );
      if (slugs.includes(saveTheDate.slug)) setRsvpSubmitted(true);
    } catch {
      // ignore
    }
  }, [rsvpEnabled, saveTheDate.slug]);

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
    <div className="relative">
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6"
      style={{ backgroundColor: theme.bgColor }}
    >
      {/* Hidden pre-buffered audio element */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audio.src}
          preload="auto"
          aria-hidden
          style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        />
      )}

      {/* Envelope overlay */}
      <AnimatePresence>
        {!hideEnvelope && hasEnvelope && envelopeTheme && !envelopeDone && (
          <EnvelopeCover
            key="envelope"
            theme={envelopeTheme}
            onOpen={handleEnvelopeOpen}
            onAnimationComplete={handleEnvelopeDone}
            shimmer={shimmer}
          />
        )}
      </AnimatePresence>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-4 text-4xl"
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

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="mb-4 text-xs tracking-widest uppercase"
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
          visibility: revealed ? "hidden" : "visible",
        }}
      >
        <EditableText elementKey="stdHint">Raspe para ver a data</EditableText>
      </motion.p>

      {/* Scratch heart with date reveal inside */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
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

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-sm tracking-wide"
        style={{
          fontFamily: resolvedCustomMessageFont,
          color: customMessageOverride?.color ?? theme.textColor,
          opacity: 0.4,
          ...(customMessageOverride?.fontSize
            ? { fontSize: customMessageOverride.fontSize }
            : {}),
          ...(customMessageOverride?.fontWeight
            ? { fontWeight: customMessageOverride.fontWeight }
            : {}),
          ...(customMessageOverride?.letterSpacing
            ? { letterSpacing: customMessageOverride.letterSpacing }
            : {}),
          visibility: !revealed ? "hidden" : "visible",
        }}
      >
        <EditableText elementKey="stdCustomMessage">
          {customMessage}
        </EditableText>
      </motion.p>

      {/* Couple names */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-8 text-2xl font-light tracking-[0.15em] uppercase"
        style={{
          fontFamily: resolvedCoupleFont,
          color: coupleOverride?.color ?? theme.textColor,
          ...(coupleOverride?.fontSize
            ? { fontSize: coupleOverride.fontSize }
            : {}),
          ...(coupleOverride?.fontWeight
            ? { fontWeight: coupleOverride.fontWeight }
            : {}),
          ...(coupleOverride?.letterSpacing
            ? { letterSpacing: coupleOverride.letterSpacing }
            : {}),
        }}
      >
        <EditableText elementKey="stdCoupleNames">
          {couple.bride} &amp; {couple.groom}
        </EditableText>
      </motion.h2>

      {/* Calendar button and/or RSVP button — only after reveal */}
      <div className="mt-10 w-full max-w-xs flex flex-col gap-3">
        {rsvpEnabled && revealed && (
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
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
          </motion.button>
        )}
        {!rsvpEnabled && (
          <CalendarButton
            date={date}
            couple={couple}
            theme={theme}
            visible={revealed}
          />
        )}
      </div>

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
        <SaveTheDateBottomHero config={bottomHero} theme={theme} textStyles={textStyles} isPreview={hideEnvelope} />
      )}
    </div>
  );
}
