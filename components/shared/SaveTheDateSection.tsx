"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { InvitationData, TemplateTheme, SaveDateStyle } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import CalendarButton from "./CalendarButton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ---------------------------------------------------------------------------
// Shared props for all variants
// ---------------------------------------------------------------------------

export interface SaveTheDateProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  /** Per-section card background override. Falls back to theme.cardBg. */
  cardBg?: string;
  /** Per-section card border override. Falls back to theme.cardBorder. */
  cardBorder?: string;
  onCalendarClick?: () => void;
  isPreview?: boolean;
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function AccentLine({ ts }: { ts: ResolvedTextStyles }) {
  return (
    <motion.div
      className="my-5"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.3, ease: EASE }}
      style={{
        width: 80,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${ts.accent}, transparent)`,
        opacity: 0.35,
      }}
    />
  );
}

function SaveLabel({ ts }: { ts: ResolvedTextStyles }) {
  return <span style={ts.saveLabel}>Save the Date</span>;
}

function CalendarCTA({
  invitation,
  ts,
  onCalendarClick,
}: {
  invitation: InvitationData;
  ts: ResolvedTextStyles;
  onCalendarClick?: () => void;
}) {
  return (
    <CalendarButton
      date={invitation.date}
      location={invitation.location}
      couple={invitation.couple}
      onCalendarClick={onCalendarClick}
      className="mt-5 flex items-center justify-center gap-2 px-5 py-2 transition-all"
    >
      <span style={ts.calendarCta}>+ Adicionar ao Calendário</span>
    </CalendarButton>
  );
}

// ---------------------------------------------------------------------------
// 1. Classic — the original single glassmorphism card
// ---------------------------------------------------------------------------

function SaveTheDateClassic({
  invitation,
  theme,
  ts,
  onCalendarClick,
}: SaveTheDateProps) {
  return (
    <div
      className="relative flex flex-col items-center text-center"
      style={{
        background: theme.cardBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 20,
        padding: "36px 28px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <SaveLabel ts={ts} />

      {/* Day — oversized */}
      <span className="mt-3" style={ts.dateDay}>
        {invitation.date.day}
      </span>

      {/* Month */}
      <span className="mt-1" style={ts.dateMonth}>
        {invitation.date.month}
      </span>

      {/* Year */}
      <span className="mt-1" style={ts.dateYear}>
        {invitation.date.year}
      </span>

      <AccentLine ts={ts} />

      {/* Day of week + time */}
      <span style={ts.dateTime}>
        {invitation.date.dayOfWeek} &middot; {invitation.date.time}
      </span>

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        onCalendarClick={onCalendarClick}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Countdown — live ticking timer to the wedding date
// ---------------------------------------------------------------------------

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

function computeTimeLeft(isoDate: string, timeStr: string): TimeLeft {
  // Parse the wedding date in Europe/Lisbon timezone
  // We combine the date part with the time field
  const datePart = isoDate.split("T")[0]; // "YYYY-MM-DD"
  const time = timeStr || "00:00";

  // Build a date string that we can parse
  const [hour, minute] = time.split(":").map(Number);
  const [year, month, day] = datePart.split("-").map(Number);

  // Create the target in UTC by computing what midnight Lisbon corresponds to.
  // Portugal is UTC+0 (WET) in winter, UTC+1 (WEST) in summer.
  // We use Intl.DateTimeFormat to determine the offset for the target date.
  const approxDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  // Get the UTC offset for that local time in Lisbon
  const lisbonFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Format the approx date in Lisbon time to get parts
  const parts = lisbonFormatter.formatToParts(approxDate);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  // Reconstruct what Lisbon time approxDate corresponds to
  const lisbonHour = get("hour");
  const lisbonMinute = get("minute");

  // Offset in minutes from Lisbon to UTC for this date
  // UTC = Lisbon_wall_clock - offset => offset = wall - UTC
  const offsetMs =
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      lisbonHour,
      lisbonMinute,
    ) - approxDate.getTime();
  const offsetMinutes = Math.round(offsetMs / 60000);

  // Build target UTC ms: Lisbon time minus offset
  const targetMs =
    Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60000;

  const now = Date.now();
  const diff = targetMs - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      passed: diff < -86400000,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    passed: false,
  };
}

function CountdownUnit({
  value,
  label,
  theme,
  ts,
}: {
  value: number;
  label: string;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{
          background: theme.cardBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 12,
          padding: "14px 10px",
          minWidth: 58,
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        }}
      >
        <span
          style={{
            fontSize: 25,
            fontWeight: 300,
            lineHeight: 1,
            color: ts.textPrimary,
            letterSpacing: -1,
            display: "block",
            textAlign: "center",
          }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        style={{
          fontFamily: ts.uiFont,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: 2.5,
          textTransform: "uppercase" as const,
          color: ts.textMuted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SaveTheDateCountdown({
  invitation,
  theme,
  ts,
  onCalendarClick,
}: SaveTheDateProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    computeTimeLeft(invitation.date.iso, invitation.date.time),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(invitation.date.iso, invitation.date.time));
    }, 1000);
    return () => clearInterval(interval);
  }, [invitation.date.iso, invitation.date.time]);

  const isCelebration =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <div
      className="relative flex flex-col items-center text-center"
      style={{
        background: theme.cardBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 20,
        padding: "32px 24px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <SaveLabel ts={ts} />

      {/* Date context */}
      <span
        className="mt-3"
        style={{
          fontFamily: ts.scriptFont,
          fontSize: 22,
          fontWeight: 300,
          color: ts.textPrimary,
          letterSpacing: 1,
        }}
      >
        {invitation.date.day} · {invitation.date.month} · {invitation.date.year}
      </span>

      <span
        style={{
          fontFamily: ts.uiFont,
          fontSize: 12,
          fontWeight: 300,
          letterSpacing: 1,
          color: ts.textMuted,
          marginTop: 2,
        }}
      >
        {invitation.date.dayOfWeek} &middot; {invitation.date.time}
      </span>

      <AccentLine ts={ts} />

      {/* Countdown tiles */}
      {isCelebration ? (
        <div className="flex flex-col items-center gap-2 py-3">
          <span
            style={{
              fontFamily: ts.scriptFont,
              fontSize: 28,
              color: ts.accent,
            }}
          >
            Hoje é o grande dia!
          </span>
          <span
            style={{
              fontFamily: ts.uiFont,
              fontSize: 12,
              color: ts.textSecondary,
              letterSpacing: 1,
            }}
          >
            {invitation.couple.bride} &amp; {invitation.couple.groom}
          </span>
        </div>
      ) : (
        <div className="flex items-start justify-center gap-1">
          <CountdownUnit
            value={timeLeft.days}
            label="Dias"
            theme={theme}
            ts={ts}
          />
          <span
            style={{
              fontFamily: ts.scriptFont,
              fontSize: 36,
              color: ts.accent,
              lineHeight: 1,
              marginTop: 10,
              opacity: 0.5,
            }}
          >
            :
          </span>
          <CountdownUnit
            value={timeLeft.hours}
            label="Horas"
            theme={theme}
            ts={ts}
          />
          <span
            style={{
              fontFamily: ts.scriptFont,
              fontSize: 36,
              color: ts.accent,
              lineHeight: 1,
              marginTop: 10,
              opacity: 0.5,
            }}
          >
            :
          </span>
          <CountdownUnit
            value={timeLeft.minutes}
            label="Minutos"
            theme={theme}
            ts={ts}
          />
          <span
            style={{
              fontFamily: ts.scriptFont,
              fontSize: 36,
              color: ts.accent,
              lineHeight: 1,
              marginTop: 10,
              opacity: 0.5,
            }}
          >
            :
          </span>
          <CountdownUnit
            value={timeLeft.seconds}
            label="Segundos"
            theme={theme}
            ts={ts}
          />
        </div>
      )}

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        onCalendarClick={onCalendarClick}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Quad Cards — 2×2 grid of 4 glassmorphism tiles
// ---------------------------------------------------------------------------

function QuadCard({
  label,
  value,
  valueFontSize = 48,
  theme,
  ts,
  delay = 0,
}: {
  label: string;
  value: string;
  valueFontSize?: number;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className="flex flex-col items-center justify-center text-center"
      style={{
        background: theme.cardBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        padding: "20px 12px",
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        minHeight: 100,
      }}
    >
      <span
        style={{
          fontSize: valueFontSize,
          fontWeight: 300,
          lineHeight: 1,
          color: ts.textPrimary,
          letterSpacing: valueFontSize > 40 ? -1 : 0,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: ts.uiFont,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: 2.5,
          textTransform: "uppercase" as const,
          color: ts.accent,
          marginTop: 8,
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function SaveTheDateQuadCards({
  invitation,
  theme,
  ts,
  onCalendarClick,
}: SaveTheDateProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header label */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <SaveLabel ts={ts} />
      </motion.div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <QuadCard
          label="Dia"
          value={invitation.date.day}
          valueFontSize={24}
          theme={theme}
          ts={ts}
          delay={0.05}
        />
        <QuadCard
          label="Mês"
          value={invitation.date.month}
          valueFontSize={24}
          theme={theme}
          ts={ts}
          delay={0.1}
        />
        <QuadCard
          label="Ano"
          value={invitation.date.year}
          valueFontSize={24}
          theme={theme}
          ts={ts}
          delay={0.15}
        />
        <QuadCard
          label="Dia da Semana"
          value={invitation.date.dayOfWeek}
          valueFontSize={24}
          theme={theme}
          ts={ts}
          delay={0.2}
        />
      </div>

      {/* Time + Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
        className="flex flex-col items-center gap-1"
      >
        <span
          style={{
            fontFamily: ts.uiFont,
            fontSize: 12,
            fontWeight: 300,
            letterSpacing: 2,
            color: ts.textMuted,
          }}
        >
          {invitation.date.time}
        </span>
        <CalendarCTA
          invitation={invitation}
          ts={ts}
          onCalendarClick={onCalendarClick}
        />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Cinematic Banner — full-bleed image top half + frosted date ribbon
// ---------------------------------------------------------------------------

const CINEMATIC_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80&fit=crop";

function SaveTheDateCinematic({
  invitation,
  theme,
  ts,
  onCalendarClick,
}: SaveTheDateProps) {
  const bgImage =
    invitation.cinematicImageUrl?.trim() || CINEMATIC_DEFAULT_IMAGE;

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden"
      style={{
        borderRadius: 20,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      {/* Top half — full-bleed photo with overlay */}
      <div
        className="relative w-full flex flex-col items-center justify-end overflow-hidden"
        style={{ minHeight: 220 }}
      >
        {/* Background image */}
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: EASE }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Dark gradient overlay — heavier at bottom for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* Thin accent bar at the very top */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${ts.accent}, transparent)`,
            opacity: 0.7,
          }}
        />

        {/* Content sits above the overlay */}
        <div
          className="relative z-10 flex flex-col items-center w-full"
          style={{ padding: "28px 24px 28px" }}
        >
          {/* "Save the Date" label — white on dark image */}
          <span
            style={{
              fontFamily: ts.uiFont,
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: 5,
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Save the Date
          </span>

          {/* Script couple names */}
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
            className="mt-3 text-center"
            style={{
              fontFamily: ts.scriptFont,
              fontSize: 52,
              fontWeight: 400,
              lineHeight: 1.15,
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 2px 24px rgba(0,0,0,0.4)",
              letterSpacing: 1,
            }}
          >
            {invitation.couple.bride} &amp; {invitation.couple.groom}
          </motion.span>

          {/* Thin accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.45, ease: EASE }}
            className="mt-4"
            style={{
              width: 80,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            }}
          />
        </div>
      </div>

      {/* Bottom ribbon — frosted glass date bar */}
      <div
        className="w-full"
        style={{
          background: theme.cardBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `1px solid ${theme.cardBorder}`,
          padding: "20px 24px",
        }}
      >
        {/* Horizontal date ribbon */}
        <div className="flex items-center justify-center gap-4">
          <span
            style={{
              fontFamily: ts.scriptFont,
              fontSize: 40,
              fontWeight: 300,
              lineHeight: 1,
              color: ts.textPrimary,
              letterSpacing: -1,
            }}
          >
            {invitation.date.day}
          </span>

          <div
            style={{
              width: 1,
              height: 36,
              background: ts.accent,
              opacity: 0.25,
            }}
          />

          <div className="flex flex-col items-center gap-0.5">
            <span
              style={{
                fontFamily: ts.uiFont,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase" as const,
                color: ts.textSecondary,
              }}
            >
              {invitation.date.month}
            </span>
            <span
              style={{
                fontFamily: ts.bodyFont,
                fontSize: 12,
                fontWeight: 300,
                color: ts.textMuted,
                letterSpacing: 1,
              }}
            >
              {invitation.date.year}
            </span>
          </div>

          <div
            style={{
              width: 1,
              height: 36,
              background: ts.accent,
              opacity: 0.25,
            }}
          />

          <div className="flex flex-col items-center gap-0.5">
            <span
              style={{
                fontFamily: ts.uiFont,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: 2,
                color: ts.textSecondary,
              }}
            >
              {invitation.date.dayOfWeek}
            </span>
            <span
              style={{
                fontFamily: ts.uiFont,
                fontSize: 12,
                fontWeight: 300,
                color: ts.textMuted,
              }}
            >
              {invitation.date.time}
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <CalendarCTA
            invitation={invitation}
            ts={ts}
            onCalendarClick={onCalendarClick}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Minimal Line — horizontal inline, no card background
// ---------------------------------------------------------------------------

function SaveTheDateMinimalLine({
  invitation,
  ts,
  onCalendarClick,
}: SaveTheDateProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <SaveLabel ts={ts} />
      </motion.div>

      {/* Main date line — large, spaced */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1"
      >
        <span
          style={{
            fontFamily: ts.bodyFont,
            fontSize: 30,
            fontWeight: 300,
            lineHeight: 1,
            color: ts.textPrimary,
            letterSpacing: -1,
          }}
        >
          {invitation.date.day}
        </span>
        <span
          style={{
            color: ts.accent,
            opacity: 0.4,
            fontSize: 28,
            fontWeight: 200,
          }}
        >
          ·
        </span>
        <span
          style={{
            fontFamily: ts.bodyFont,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 5,
            textTransform: "uppercase" as const,
            color: ts.textSecondary,
          }}
        >
          {invitation.date.month}
        </span>
        <span
          style={{
            color: ts.accent,
            opacity: 0.4,
            fontSize: 28,
            fontWeight: 200,
          }}
        >
          ·
        </span>
        <span
          style={{
            fontFamily: ts.bodyFont,
            fontSize: 24,
            fontWeight: 300,
            color: ts.textMuted,
          }}
        >
          {invitation.date.year}
        </span>
      </motion.div>

      {/* Accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: EASE }}
        style={{
          width: 120,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${ts.accent}, transparent)`,
          opacity: 0.3,
        }}
      />

      {/* Day · Time */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
        className="flex items-center gap-3"
      >
        <span
          style={{
            fontFamily: ts.uiFont,
            fontSize: 12,
            fontWeight: 300,
            letterSpacing: 3,
            color: ts.textSecondary,
            textTransform: "uppercase" as const,
          }}
        >
          {invitation.date.dayOfWeek}
        </span>
        <span style={{ color: ts.accent, opacity: 0.4, fontSize: 16 }}>·</span>
        <span
          style={{
            fontFamily: ts.uiFont,
            fontSize: 12,
            fontWeight: 300,
            letterSpacing: 2,
            color: ts.textMuted,
          }}
        >
          {invitation.date.time}
        </span>
      </motion.div>

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        onCalendarClick={onCalendarClick}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — dispatches to the correct variant
// ---------------------------------------------------------------------------

export default function SaveTheDateSection({
  invitation,
  theme: rawTheme,
  ts,
  cardBg,
  cardBorder,
  onCalendarClick,
  isPreview,
}: SaveTheDateProps) {
  // Merge per-section card overrides into theme so all variants pick them up
  const theme = {
    ...rawTheme,
    cardBg: cardBg || rawTheme.cardBg,
    cardBorder: cardBorder || rawTheme.cardBorder,
  };
  const style: SaveDateStyle = invitation.saveDateStyle ?? "classic";

  switch (style) {
    case "countdown":
      return (
        <SaveTheDateCountdown
          invitation={invitation}
          theme={theme}
          ts={ts}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
        />
      );
    case "quad-cards":
      return (
        <SaveTheDateQuadCards
          invitation={invitation}
          theme={theme}
          ts={ts}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
        />
      );
    case "cinematic":
      return (
        <SaveTheDateCinematic
          invitation={invitation}
          theme={theme}
          ts={ts}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
        />
      );
    case "minimal-line":
      return (
        <SaveTheDateMinimalLine
          invitation={invitation}
          theme={theme}
          ts={ts}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
        />
      );
    case "classic":
    default:
      return (
        <SaveTheDateClassic
          invitation={invitation}
          theme={theme}
          ts={ts}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
        />
      );
  }
}
