"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { SaveTheDateData } from "@/lib/save-the-date";
import ScratchHeart from "./ScratchHeart";
import DateReveal from "./DateReveal";
import CalendarButton from "./CalendarButton";

interface SaveTheDateViewProps {
  saveTheDate: SaveTheDateData;
}

const HEART_SIZE = 280;

export default function SaveTheDateView({ saveTheDate }: SaveTheDateViewProps) {
  const { couple, date, customMessage, theme } = saveTheDate;
  const [revealed, setRevealed] = useState(false);

  // Track page view
  useEffect(() => {
    fetch("/api/save-the-date/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: saveTheDate.slug, type: "page_view" }),
    }).catch(() => {});
  }, [saveTheDate.slug]);

  const handleReveal = useCallback(() => {
    setRevealed(true);

    // Track scratch event
    fetch("/api/save-the-date/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: saveTheDate.slug,
        type: "heart_scratched",
      }),
    }).catch(() => {});

    // Fire confetti explosion
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

    // Multiple bursts for a rich effect
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
      style={{
        backgroundColor: theme.bgColor,
      }}
    >
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-8 text-4xl"
        style={{
          fontFamily: theme.titleFont,
          color: theme.textColor,
        }}
      >
        Save the Date
      </motion.h1>

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
            customMessage={customMessage}
            theme={theme}
            revealed={revealed}
          />
        </ScratchHeart>
      </motion.div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 0 : 0.5 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="mt-4 text-xs tracking-widest uppercase"
        style={{
          fontFamily: theme.coupleFont,
          color: theme.textColor,
        }}
      >
        {!revealed && "Scratch the heart to reveal"}
      </motion.p>

      {/* Couple names */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-8 text-2xl font-light tracking-[0.15em] uppercase"
        style={{
          fontFamily: theme.coupleFont,
          color: theme.textColor,
        }}
      >
        {couple.bride} & {couple.groom}
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
