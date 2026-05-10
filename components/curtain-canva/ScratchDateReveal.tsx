"use client";

import type { CSSProperties } from "react";
import type { CustomTexts, TemplateTheme } from "@/lib/types";
import { t } from "@/lib/custom-texts";
import { resolveCoinColors, shortMonthName } from "@/lib/curtain-canva";
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
  const { baseColor, accentColor } = resolveCoinColors(theme);
  const monthShort = shortMonthName(date.iso, date.month);

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
          baseColor={baseColor}
          accentColor={accentColor}
          ariaLabel="Raspe para revelar o dia"
          contentStyle={datePartStyle}
          content={date.day || "—"}
          subLabel={t(customTexts, "saveDate_dayLabel")}
          theme={theme}
        />
        <CoinWithLabel
          coinSize={coinSize}
          baseColor={baseColor}
          accentColor={accentColor}
          ariaLabel="Raspe para revelar o mês"
          contentStyle={datePartStyle}
          content={monthShort || "—"}
          subLabel={t(customTexts, "saveDate_monthLabel")}
          theme={theme}
        />
        <CoinWithLabel
          coinSize={coinSize}
          baseColor={baseColor}
          accentColor={accentColor}
          ariaLabel="Raspe para revelar o ano"
          contentStyle={datePartStyle}
          content={date.year || "—"}
          subLabel={t(customTexts, "saveDate_yearLabel")}
          theme={theme}
        />
      </div>
    </section>
  );
}

function CoinWithLabel({
  coinSize,
  baseColor,
  accentColor,
  ariaLabel,
  contentStyle,
  content,
  subLabel,
  theme,
}: {
  coinSize: string;
  baseColor: string;
  accentColor: string;
  ariaLabel: string;
  contentStyle: CSSProperties;
  content: string;
  subLabel: string;
  theme: TemplateTheme;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: coinSize, height: coinSize }}>
        <ScratchCoin
          size={undefined as unknown as number /* size driven by parent */}
          fillParent
          baseColor={baseColor}
          accentColor={accentColor}
          ariaLabel={ariaLabel}
          revealedContent={<span style={contentStyle}>{content}</span>}
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
