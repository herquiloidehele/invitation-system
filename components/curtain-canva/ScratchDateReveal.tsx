"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import type { CustomTexts, TemplateTheme } from "@/lib/types";
import { t } from "@/lib/custom-texts";
import { resolveCelebrationPalette, shortMonthName } from "@/lib/curtain-canva";
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
}

export default function ScratchDateReveal({
  date,
  theme,
  customTexts,
}: ScratchDateRevealProps) {
  const monthShort = shortMonthName(date.iso, date.month);

  // Track which coins have been revealed so we can fire confetti exactly
  // once when all three are done. We use a ref so the callback identity is
  // stable across renders.
  const revealedCoinsRef = useRef<Set<string>>(new Set());
  const celebratedRef = useRef(false);

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

      // A small follow-up burst from the centre for emphasis.
      window.setTimeout(() => {
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

  return (
    <section
      id="date"
      className="py-20 md:py-28 px-6 max-w-[640px] mx-auto text-center"
    >
      <h2
        style={{
          fontFamily: theme.displayFont,
          color: theme.textPrimary,
          fontSize: "clamp(2rem, 7vw, 2.75rem)",
          lineHeight: 1.05,
        }}
      >
        {t(customTexts, "scratch_title")}
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
        }}
      >
        {t(customTexts, "scratch_subtitle")}
      </p>

      <div className="mt-10 flex justify-center items-end gap-3 sm:gap-5">
        <CoinWithLabel
          coinSize={coinSize}
          ariaLabel="Raspe para revelar o dia"
          contentStyle={datePartStyle}
          content={date.day || "—"}
          subLabel={t(customTexts, "saveDate_dayLabel")}
          theme={theme}
          onRevealed={() => handleCoinRevealed("day")}
        />
        <CoinWithLabel
          coinSize={coinSize}
          ariaLabel="Raspe para revelar o mês"
          contentStyle={datePartStyle}
          content={monthShort || "—"}
          subLabel={t(customTexts, "saveDate_monthLabel")}
          theme={theme}
          onRevealed={() => handleCoinRevealed("month")}
        />
        <CoinWithLabel
          coinSize={coinSize}
          ariaLabel="Raspe para revelar o ano"
          contentStyle={datePartStyle}
          content={date.year || "—"}
          subLabel={t(customTexts, "saveDate_yearLabel")}
          theme={theme}
          onRevealed={() => handleCoinRevealed("year")}
        />
      </div>
    </section>
  );
}

function CoinWithLabel({
  coinSize,
  ariaLabel,
  contentStyle,
  content,
  subLabel,
  theme,
  onRevealed,
}: {
  coinSize: string;
  ariaLabel: string;
  contentStyle: CSSProperties;
  content: string;
  subLabel: string;
  theme: TemplateTheme;
  onRevealed?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: coinSize, height: coinSize }}>
        <ScratchCoin
          size={undefined as unknown as number /* size driven by parent */}
          fillParent
          ariaLabel={ariaLabel}
          revealedContent={<span style={contentStyle}>{content}</span>}
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
        }}
      >
        {subLabel}
      </span>
    </div>
  );
}
