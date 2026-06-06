"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { CustomTexts, TemplateTheme } from "@/lib/types";
import { useCustomText } from "@/lib/custom-texts";
import { pickRsvpHeroSource } from "@/lib/rsvp-page-hero";
import { computeCountdownTimeLeft } from "@/lib/countdown";

interface Props {
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  invitationName: string;
  dateDisplay: string;
  dateIso?: string;
  dateTime?: string;
  adminBackgroundOverride?: string;
  cinematicImageUrl?: string;
  videoPoster?: string;
}

function useCountdownDays(dateIso?: string, dateTime?: string): number | null {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!dateIso) return null;
  const left = computeCountdownTimeLeft(dateIso, dateTime, now);
  if (left.passed) return null;
  return left.days;
}

export default function RsvpHero({
  theme,
  customTexts,
  invitationName,
  dateDisplay,
  dateIso,
  dateTime,
  adminBackgroundOverride,
  cinematicImageUrl,
  videoPoster,
}: Props) {
  const t = useCustomText(customTexts);
  const imageSrc = pickRsvpHeroSource({
    adminBackgroundOverride,
    cinematicImageUrl,
    videoPoster,
  });

  const days = useCountdownDays(dateIso, dateTime);

  const namesStyle: CSSProperties = {
    fontFamily: theme.displayFont,
    color: imageSrc ? "#FFFFFF" : theme.textPrimary,
    textShadow: imageSrc ? "0 1px 12px rgba(0,0,0,0.45)" : undefined,
  };

  const dateStyle: CSSProperties = {
    fontFamily: theme.scriptFont ?? theme.bodyFont,
    color: imageSrc ? "rgba(255,255,255,0.92)" : theme.textSecondary,
    textShadow: imageSrc ? "0 1px 8px rgba(0,0,0,0.4)" : undefined,
  };

  // On the gradient fallback we deliberately use theme.accent (not
  // theme.decorativeColor, which is tuned for the envelope's
  // contrasting backdrop and reads as washed-out on a flat light panel).
  const dividerStyle: CSSProperties = {
    color: imageSrc ? "rgba(255,255,255,0.85)" : theme.accent,
    opacity: imageSrc ? 1 : 0.7,
  };

  const chipStyle: CSSProperties = {
    backgroundColor: imageSrc
      ? "rgba(255,255,255,0.18)"
      : `${theme.accent}22`,
    color: imageSrc ? "#FFFFFF" : theme.accent,
    backdropFilter: imageSrc ? "blur(6px)" : undefined,
    fontFamily: theme.uiFont,
  };

  const eyebrowStyle: CSSProperties = {
    fontFamily: theme.uiFont,
    color: imageSrc ? "rgba(255,255,255,0.85)" : theme.textSecondary,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: 500,
  };

  // Photo heroes get more presence (cover image needs room to breathe);
  // the gradient fallback hugs its content so we don't leave dead space.
  const sectionMinHeight = imageSrc ? "48vh" : undefined;
  const innerMinHeight = imageSrc ? "48vh" : undefined;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: sectionMinHeight,
        background: imageSrc
          ? undefined
          : theme.bgGradient
            ? `${theme.bgGradient}, ${theme.bg}`
            : theme.bg,
      }}
    >
      {imageSrc && (
        <>
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          {/* Dark overlay — keeps white text legible over light photos
              (e.g. building facades, sky-heavy compositions). */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.15) 100%)",
            }}
          />
        </>
      )}

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${theme.bg} 100%)`,
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center justify-center px-6 py-12 sm:py-14 text-center"
        style={{ minHeight: innerMinHeight }}
      >
        <p className="mb-6" style={eyebrowStyle}>
          {t("cta_confirmLabel")}
        </p>

        <h1
          className="text-3xl sm:text-4xl font-light leading-tight tracking-tight"
          style={namesStyle}
        >
          {invitationName}
        </h1>

        <div
          aria-hidden
          className="my-5 flex items-center gap-2 text-xs"
          style={dividerStyle}
        >
          <span>◇</span>
          <span>◇</span>
          <span>◇</span>
        </div>

        {dateDisplay && (
          <p className="text-base sm:text-lg" style={dateStyle}>
            {dateDisplay}
          </p>
        )}

        {days !== null && days > 0 && (
          <p
            className="mt-5 rounded-full px-4 py-1.5 text-xs tracking-wide"
            style={chipStyle}
          >
            {t("rsvp_countdownPrefix", { count: String(days) })}
          </p>
        )}
      </div>
    </section>
  );
}
