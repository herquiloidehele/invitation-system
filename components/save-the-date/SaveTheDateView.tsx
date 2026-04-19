"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { SaveTheDateData } from "@/lib/save-the-date";
import type { TemplateTheme } from "@/lib/types";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import ScratchHeart from "./ScratchHeart";
import DateReveal from "./DateReveal";
import CalendarButton from "./CalendarButton";
import { useDynamicFonts } from "@/hooks/useDynamicFont";
import { EditableText } from "@/components/shared/EditableText";

interface SaveTheDateViewProps {
  saveTheDate: SaveTheDateData;
  hideEnvelope?: boolean;
}

const HEART_SIZE = 280;

export default function SaveTheDateView({
  saveTheDate,
  hideEnvelope = false,
}: SaveTheDateViewProps) {
  const { couple, date, customMessage, theme, textStyles } = saveTheDate;
  const [revealed, setRevealed] = useState(false);
  const [envelopeDone, setEnvelopeDone] = useState(false);

  // Element-level overrides from the shared TextStyleOverrides system
  const titleOverride = textStyles?.elements?.stdTitle;
  const coupleOverride = textStyles?.elements?.stdCoupleNames;
  const hintOverride = textStyles?.elements?.stdHint;
  const dateOverride = textStyles?.elements?.stdDate;
  const customMessageOverride = textStyles?.elements?.stdCustomMessage;

  // Resolve fonts — element override wins, fall back to theme
  const resolvedTitleFont = titleOverride?.fontFamily ?? theme.titleFont;
  const resolvedCoupleFont = coupleOverride?.fontFamily ?? theme.coupleFont;
  const resolvedHintFont = hintOverride?.fontFamily ?? theme.coupleFont;
  const resolvedDateFont = dateOverride?.fontFamily ?? theme.dateFont;
  const resolvedCustomMessageFont =
    customMessageOverride?.fontFamily ?? theme.dateFont;

  // Load any custom Google Fonts that were overridden
  useDynamicFonts([
    titleOverride?.fontFamily ?? null,
    coupleOverride?.fontFamily ?? null,
    hintOverride?.fontFamily ?? null,
    dateOverride?.fontFamily ?? null,
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

  const handleEnvelopeOpen = useCallback(() => {
    fetch("/api/save-the-date/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: saveTheDate.slug, type: "envelope_open" }),
    }).catch(() => {});
  }, [saveTheDate.slug]);

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

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6"
      style={{ backgroundColor: theme.bgColor }}
    >
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
        >
          <DateReveal
            date={date}
            theme={theme}
            dateOverride={dateOverride}
            resolvedDateFont={resolvedDateFont}
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

      {/* Calendar button — only after reveal */}
      <div className="mt-10 w-full max-w-xs">
        <CalendarButton
          date={date}
          couple={couple}
          theme={theme}
          visible={revealed}
        />
      </div>
    </div>
  );
}
