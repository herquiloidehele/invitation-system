"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import type {
  CustomTexts,
  TemplateTheme,
  TextStyle,
  TextStyleOverrides,
} from "@/lib/types";
import { t } from "@/lib/custom-texts";
import {
  resolveCelebrationPalette,
  resolveCoinGlitterPalette,
  resolveTextElementOverride,
  shortMonthName,
} from "@/lib/curtain-canva";
import { EditableText } from "@/components/shared/EditableText";
import ScratchCoin from "./ScratchCoin";

interface ScratchDateRevealProps {
  date: {
    iso: string;
    day: string;
    month: string;
    year: string;
  };
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  /**
   * Per-invitation text style overrides. Applied on top of the section's
   * default inline styles so admin element-level customizations (section
   * title, labels, date day/month/year) win without losing the curtain-
   * specific typography defaults.
   */
  textStyles?: TextStyleOverrides;
}

export default function ScratchDateReveal({
  date,
  theme,
  customTexts,
  textStyles,
}: ScratchDateRevealProps) {
  const titleOverride = resolveTextElementOverride(textStyles, "sectionTitles");
  const labelsOverride = resolveTextElementOverride(textStyles, "labels");
  const dateDayOverride = resolveTextElementOverride(textStyles, "dateDay");
  const dateMonthOverride = resolveTextElementOverride(textStyles, "dateMonth");
  const dateYearOverride = resolveTextElementOverride(textStyles, "dateYear");
  const monthShort = shortMonthName(date.iso, date.month);
  const reduceMotion = useReducedMotion();

  // Track which coins have been revealed so we can fire confetti exactly
  // once when all three are done. We use a ref so the callback identity is
  // stable across renders.
  const revealedCoinsRef = useRef<Set<string>>(new Set());
  const celebratedRef = useRef(false);
  const followupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireCelebration = useCallback(() => {
    if (celebratedRef.current) return;
    celebratedRef.current = true;

    // Lazy-load canvas-confetti so the dependency only ships when the user
    // actually reaches this moment.
    import("canvas-confetti").then(({ default: confetti }) => {
      const colors = resolveCelebrationPalette(theme);

      // Two angled bursts from the bottom corners — classy, theme-tinted.
      const baseOptions = {
        particleCount: 90,
        spread: 70,
        startVelocity: 45,
        scalar: 1,
        ticks: 220,
        gravity: 1.05,
        colors,
      };
      confetti({ ...baseOptions, angle: 60, origin: { x: 0.05, y: 0.85 } });
      confetti({ ...baseOptions, angle: 120, origin: { x: 0.95, y: 0.85 } });

      // A small follow-up burst from the centre for emphasis. Tracked so
      // unmount can cancel it before it fires on a torn-down section.
      followupTimeoutRef.current = setTimeout(() => {
        followupTimeoutRef.current = null;
        confetti({
          particleCount: 60,
          spread: 100,
          startVelocity: 35,
          scalar: 0.9,
          ticks: 200,
          colors,
          origin: { x: 0.5, y: 0.6 },
        });
      }, 180);
    });
  }, [theme]);

  useEffect(() => {
    return () => {
      if (followupTimeoutRef.current) {
        clearTimeout(followupTimeoutRef.current);
        followupTimeoutRef.current = null;
      }
    };
  }, []);

  const handleCoinRevealed = useCallback(
    (key: "day" | "month" | "year") => {
      revealedCoinsRef.current.add(key);
      if (revealedCoinsRef.current.size === 3) {
        fireCelebration();
      }
    },
    [fireCelebration],
  );

  const datePartStyle: CSSProperties = {
    fontFamily: theme.displayFont,
    color: theme.textPrimary,
    fontSize: "clamp(1rem, 4vw, 1.35rem)",
    fontWeight: 500,
    lineHeight: 1,
  };

  // Coin sizing: scales down with viewport so three fit on one line on
  // mobile (≈ width / 4 each, capped at 96px desktop).
  const coinSize = "clamp(72px, 22vw, 96px)";

  // Theme-derived glitter palette so each invitation's coins match its
  // accent/decorative colors instead of always rendering as gold. Memoized
  // because ScratchCoin's texture-painting effect depends on the array
  // identity — a new reference every render would repaint on every render.
  const glitterColors = useMemo(
    () => resolveCoinGlitterPalette(theme),
    [theme],
  );

  return (
    <motion.section
      id="date"
      className="py-20 md:py-28 px-6 max-w-[640px] mx-auto text-center"
      // Subtle fade-in-up the first time the section enters the viewport.
      // Reduced-motion users skip the offset and animation duration.
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h2
        style={{
          fontFamily: theme.displayFont,
          color: theme.textPrimary,
          fontSize: "clamp(2rem, 7vw, 2.75rem)",
          lineHeight: 1.05,
          ...titleOverride,
        }}
      >
        <EditableText elementKey="sectionTitles">
          {t(customTexts, "scratch_title")}
        </EditableText>
      </h2>
      {/* Decorative gold rule */}
      <div
        aria-hidden
        className="mx-auto mt-4"
        style={{
          width: 48,
          height: 1,
          background: theme.accent || "#C9A961",
          opacity: 0.7,
        }}
      />
      <p
        className="mt-4 uppercase"
        style={{
          fontFamily: theme.uiFont,
          color: theme.textSecondary,
          fontSize: "clamp(0.65rem, 2.4vw, 0.75rem)",
          letterSpacing: "0.22em",
          ...labelsOverride,
        }}
      >
        <EditableText elementKey="labels">
          {t(customTexts, "scratch_subtitle")}
        </EditableText>
      </p>

      <div className="mt-10 flex justify-center items-end gap-3 sm:gap-5">
        <CoinWithLabel
          coinSize={coinSize}
          ariaLabel="Raspe para revelar o dia"
          contentStyle={datePartStyle}
          contentOverride={dateDayOverride}
          content={date.day || "—"}
          contentElementKey="dateDay"
          subLabel={t(customTexts, "saveDate_dayLabel")}
          subLabelOverride={labelsOverride}
          theme={theme}
          glitterColors={glitterColors}
          onRevealed={() => handleCoinRevealed("day")}
        />
        <CoinWithLabel
          coinSize={coinSize}
          ariaLabel="Raspe para revelar o mês"
          contentStyle={datePartStyle}
          contentOverride={dateMonthOverride}
          content={monthShort || "—"}
          contentElementKey="dateMonth"
          subLabel={t(customTexts, "saveDate_monthLabel")}
          subLabelOverride={labelsOverride}
          theme={theme}
          glitterColors={glitterColors}
          onRevealed={() => handleCoinRevealed("month")}
        />
        <CoinWithLabel
          coinSize={coinSize}
          ariaLabel="Raspe para revelar o ano"
          contentStyle={datePartStyle}
          contentOverride={dateYearOverride}
          content={date.year || "—"}
          contentElementKey="dateYear"
          subLabel={t(customTexts, "saveDate_yearLabel")}
          subLabelOverride={labelsOverride}
          theme={theme}
          glitterColors={glitterColors}
          onRevealed={() => handleCoinRevealed("year")}
        />
      </div>
    </motion.section>
  );
}

function CoinWithLabel({
  coinSize,
  ariaLabel,
  contentStyle,
  contentOverride,
  content,
  contentElementKey,
  subLabel,
  subLabelOverride,
  theme,
  glitterColors,
  onRevealed,
}: {
  coinSize: string;
  ariaLabel: string;
  contentStyle: CSSProperties;
  /**
   * Admin element-level override for the revealed date part. Applied on
   * top of `contentStyle` so font/size/color customizations win without
   * losing the coin's intrinsic typography defaults.
   */
  contentOverride: TextStyle;
  content: string;
  /** EditableText key for the revealed date part (dateDay/dateMonth/dateYear). */
  contentElementKey: "dateDay" | "dateMonth" | "dateYear";
  subLabel: string;
  /** Admin override for the small `DIA` / `MÊS` / `ANO` labels under each coin. */
  subLabelOverride: TextStyle;
  theme: TemplateTheme;
  /**
   * Glitter palette painted onto the scratchable surface. Computed once by
   * the parent (`ScratchDateReveal`) from the theme's accent/decorative
   * colors so every coin shares the same memoized array reference.
   */
  glitterColors: string[];
  onRevealed?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: coinSize, height: coinSize }}>
        <ScratchCoin
          size={undefined as unknown as number /* size driven by parent */}
          fillParent
          ariaLabel={ariaLabel}
          glitterColors={glitterColors}
          revealedContent={
            <span style={{ ...contentStyle, ...contentOverride }}>
              <EditableText elementKey={contentElementKey}>
                {content}
              </EditableText>
            </span>
          }
          onRevealed={onRevealed}
        />
      </div>
      <span
        className="uppercase"
        style={{
          fontFamily: theme.uiFont,
          color: theme.textMuted,
          fontSize: 10,
          letterSpacing: "0.2em",
          ...subLabelOverride,
        }}
      >
        <EditableText elementKey="labels">{subLabel}</EditableText>
      </span>
    </div>
  );
}
