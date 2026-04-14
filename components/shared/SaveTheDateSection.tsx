"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type {
  CustomTexts,
  ImageSettingsMap,
  InvitationData,
  SaveDateStyle,
  InvitationStyles,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { getImageStyle } from "@/lib/image-settings";
import { t } from "@/lib/custom-texts";
import CalendarButton from "./CalendarButton";
import { EditableText } from "./EditableText";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ---------------------------------------------------------------------------
// Shared props for all variants
// ---------------------------------------------------------------------------

export interface SaveTheDateProps {
  invitation: InvitationData;
  theme: InvitationStyles;
  ts: ResolvedTextStyles;
  /** Per-section card background override. Falls back to theme.cardBg. */
  cardBg?: string;
  /** Per-section card border override. Falls back to theme.cardBorder. */
  cardBorder?: string;
  /** Per-section card border-radius override. Falls back to per-variant default. */
  cardBorderRadius?: number;
  onCalendarClick?: () => void;
  isPreview?: boolean;
  /** Per-image position & zoom overrides map. */
  imageSettings?: ImageSettingsMap;
  /** Per-invitation UI text overrides. */
  customTexts?: CustomTexts;
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function AccentLine({ ts }: { ts: ResolvedTextStyles }) {
  const color = (ts.accentLine.color as string) ?? ts.accent;
  const opacity = ts.accentLine.opacity ?? 0.35;
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
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity,
      }}
    />
  );
}

function SaveLabel({
  ts,
  customTexts: ct,
}: {
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
}) {
  return (
    <span style={ts.saveLabel}>
      <EditableText elementKey="saveLabel">
        {t(ct, "saveDate_label")}
      </EditableText>
    </span>
  );
}

function CalendarCTA({
  invitation,
  ts,
  onCalendarClick,
  customTexts: ct,
}: {
  invitation: InvitationData;
  ts: ResolvedTextStyles;
  onCalendarClick?: () => void;
  customTexts?: CustomTexts;
}) {
  return (
    <CalendarButton
      date={invitation.date}
      location={invitation.location}
      couple={invitation.couple}
      onCalendarClick={onCalendarClick}
      className="mt-5 flex items-center justify-center gap-2 px-5 py-2 transition-all"
    >
      <span style={ts.calendarCta}>
        <EditableText elementKey="calendarCta">
          {t(ct, "cta_addToCalendar")}
        </EditableText>
      </span>
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
  cardBorderRadius,
  onCalendarClick,
  customTexts: ct,
}: SaveTheDateProps) {
  return (
    <div
      className="relative flex flex-col items-center text-center"
      style={{
        background: theme.cardBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: cardBorderRadius ?? 20,
        padding: "36px 28px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <SaveLabel ts={ts} customTexts={ct} />

      {/* Day — oversized */}
      <span className="mt-3" style={ts.dateDay}>
        <EditableText elementKey="dateDay">{invitation.date.day}</EditableText>
      </span>

      {/* Month */}
      <span className="mt-1" style={ts.dateMonth}>
        <EditableText elementKey="dateMonth">
          {invitation.date.month}
        </EditableText>
      </span>

      {/* Year */}
      <span className="mt-1" style={ts.dateYear}>
        <EditableText elementKey="dateYear">
          {invitation.date.year}
        </EditableText>
      </span>

      <AccentLine ts={ts} />

      {/* Day of week + time */}
      <span style={ts.dateTime}>
        <EditableText elementKey="dateTime">
          {invitation.date.dayOfWeek} &middot; {invitation.date.time}
        </EditableText>
      </span>

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        onCalendarClick={onCalendarClick}
        customTexts={ct}
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
  // Parse the wedding date in Europe/Lisbon timezone.
  // The ISO date is stored as "YYYY-MM-DDT00:00:00.000Z" and the separate
  // time field holds the Lisbon wall-clock time (e.g. "16:00").
  const datePart = isoDate?.split("T")[0] ?? ""; // "YYYY-MM-DD"
  const time = timeStr || "00:00";

  const [hour, minute] = time.split(":").map(Number);
  const [year, month, day] = datePart.split("-").map(Number);

  // Guard against missing or invalid date values (e.g. empty form fields)
  if (!datePart || isNaN(year) || isNaN(month) || isNaN(day)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: false };
  }

  // Use Date.UTC (NOT new Date(year,...)) to avoid the JS quirk where years
  // 0-99 are mapped to 1900-1999 in the Date constructor.
  // We create a UTC timestamp with the wall-clock values, format it in Lisbon
  // to see what wall-clock Lisbon would show, then derive the offset.
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
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

  const parts = lisbonFormatter.formatToParts(new Date(utcGuess));
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  // The Lisbon wall-clock when utcGuess is the real UTC time:
  const lisbonFromUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  // offset = Lisbon_wall - UTC  (positive when Lisbon is ahead, i.e. summer)
  const offsetMs = lisbonFromUtc - utcGuess;

  // The target UTC ms is the desired Lisbon wall-clock minus the offset
  const targetMs = utcGuess - offsetMs;

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
  theme: InvitationStyles;
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
            ...ts.countdownValue,
            display: "block",
            textAlign: "center",
          }}
        >
          <EditableText elementKey="countdownValue">
            {String(value).padStart(2, "0")}
          </EditableText>
        </span>
      </div>
      <span style={ts.countdownLabel}>
        <EditableText elementKey="countdownLabel">{label}</EditableText>
      </span>
    </div>
  );
}

function SaveTheDateCountdown({
  invitation,
  theme,
  ts,
  cardBorderRadius,
  onCalendarClick,
  customTexts: ct,
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
        borderRadius: cardBorderRadius ?? 20,
        padding: "32px 24px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <SaveLabel ts={ts} customTexts={ct} />

      {/* Date context */}
      <span className="mt-3" style={ts.countdownDate}>
        <EditableText elementKey="countdownDate">
          {invitation.date.day} · {invitation.date.month} ·{" "}
          {invitation.date.year}
        </EditableText>
      </span>

      <span
        style={{
          ...ts.countdownWeekday,
          marginTop: 2,
        }}
      >
        <EditableText elementKey="countdownWeekday">
          {invitation.date.dayOfWeek} &middot; {invitation.date.time}
        </EditableText>
      </span>

      <AccentLine ts={ts} />

      {/* Countdown tiles */}
      {isCelebration ? (
        <div className="flex flex-col items-center gap-2 py-3">
          <span style={ts.celebrationTitle}>
            <EditableText elementKey="celebrationTitle">
              {t(ct, "saveDate_celebrationTitle")}
            </EditableText>
          </span>
          <span style={ts.celebrationCouple}>
            <EditableText elementKey="celebrationCouple">
              {invitation.couple.bride} &amp; {invitation.couple.groom}
            </EditableText>
          </span>
        </div>
      ) : (
        <div className="flex items-start justify-center gap-1">
          <CountdownUnit
            value={timeLeft.days}
            label={t(ct, "saveDate_days")}
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
            label={t(ct, "saveDate_hours")}
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
            label={t(ct, "saveDate_minutes")}
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
            label={t(ct, "saveDate_seconds")}
            theme={theme}
            ts={ts}
          />
        </div>
      )}

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        onCalendarClick={onCalendarClick}
        customTexts={ct}
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
  theme,
  ts,
  delay = 0,
  elementKey,
  valueStyle,
  labelStyle,
}: {
  label: string;
  value: string;
  theme: InvitationStyles;
  ts: ResolvedTextStyles;
  delay?: number;
  elementKey: string;
  valueStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
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
      <span style={valueStyle}>
        <EditableText elementKey={`${elementKey}Value`}>{value}</EditableText>
      </span>
      <span style={labelStyle}>
        <EditableText elementKey={`${elementKey}Label`}>{label}</EditableText>
      </span>
    </motion.div>
  );
}

function SaveTheDateQuadCards({
  invitation,
  theme,
  ts,
  cardBorderRadius,
  onCalendarClick,
  customTexts: ct,
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
        <SaveLabel ts={ts} customTexts={ct} />
      </motion.div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <QuadCard
          label={t(ct, "saveDate_dayLabel")}
          value={invitation.date.day}
          theme={theme}
          ts={ts}
          delay={0.05}
          elementKey="quadDay"
          valueStyle={ts.quadDayValue}
          labelStyle={ts.quadDayLabel}
        />
        <QuadCard
          label={t(ct, "saveDate_monthLabel")}
          value={invitation.date.month}
          theme={theme}
          ts={ts}
          delay={0.1}
          elementKey="quadMonth"
          valueStyle={ts.quadMonthValue}
          labelStyle={ts.quadMonthLabel}
        />
        <QuadCard
          label={t(ct, "saveDate_yearLabel")}
          value={invitation.date.year}
          theme={theme}
          ts={ts}
          delay={0.15}
          elementKey="quadYear"
          valueStyle={ts.quadYearValue}
          labelStyle={ts.quadYearLabel}
        />
        <QuadCard
          label={t(ct, "saveDate_dayOfWeekLabel")}
          value={invitation.date.dayOfWeek}
          theme={theme}
          ts={ts}
          delay={0.2}
          elementKey="quadDayOfWeek"
          valueStyle={ts.quadDayOfWeekValue}
          labelStyle={ts.quadDayOfWeekLabel}
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
        <span style={ts.quadTime}>
          <EditableText elementKey="quadTime">
            {invitation.date.time}
          </EditableText>
        </span>
        <CalendarCTA
          invitation={invitation}
          ts={ts}
          onCalendarClick={onCalendarClick}
          customTexts={ct}
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
  cardBorderRadius,
  onCalendarClick,
  imageSettings,
  customTexts: ct,
}: SaveTheDateProps) {
  const bgImage =
    invitation.cinematicImageUrl?.trim() || CINEMATIC_DEFAULT_IMAGE;
  const cinematicImgStyle = getImageStyle(imageSettings, "cinematicImage");

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden"
      style={{
        borderRadius: cardBorderRadius ?? 20,
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
            ...(cinematicImgStyle.objectPosition
              ? {
                  backgroundPosition: cinematicImgStyle.objectPosition,
                  ...(cinematicImgStyle.transform
                    ? {
                        transform: cinematicImgStyle.transform,
                        transformOrigin:
                          cinematicImgStyle.transformOrigin as string,
                      }
                    : {}),
                }
              : {}),
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
          <span style={ts.cinematicSaveLabel}>
            <EditableText elementKey="cinematicSaveLabel">
              {t(ct, "saveDate_label")}
            </EditableText>
          </span>

          {/* Script couple names */}
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
            className="mt-3 text-center"
            style={ts.cinematicCouple}
          >
            <EditableText elementKey="cinematicCouple">
              {invitation.couple.bride} &amp; {invitation.couple.groom}
            </EditableText>
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
          <span style={ts.cinematicDay}>
            <EditableText elementKey="cinematicDay">
              {invitation.date.day}
            </EditableText>
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
            <span style={ts.cinematicMonth}>
              <EditableText elementKey="cinematicMonth">
                {invitation.date.month}
              </EditableText>
            </span>
            <span style={ts.cinematicYear}>
              <EditableText elementKey="cinematicYear">
                {invitation.date.year}
              </EditableText>
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
            <span style={ts.cinematicDayOfWeek}>
              <EditableText elementKey="cinematicDayOfWeek">
                {invitation.date.dayOfWeek}
              </EditableText>
            </span>
            <span style={ts.cinematicTime}>
              <EditableText elementKey="cinematicTime">
                {invitation.date.time}
              </EditableText>
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <CalendarCTA
            invitation={invitation}
            ts={ts}
            onCalendarClick={onCalendarClick}
            customTexts={ct}
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
  cardBorderRadius: _cardBorderRadius,
  onCalendarClick,
  customTexts: ct,
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
        <SaveLabel ts={ts} customTexts={ct} />
      </motion.div>

      {/* Main date line — large, spaced */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1"
      >
        <span style={ts.minimalDay}>
          <EditableText elementKey="minimalDay">
            {invitation.date.day}
          </EditableText>
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
        <span style={ts.minimalMonth}>
          <EditableText elementKey="minimalMonth">
            {invitation.date.month}
          </EditableText>
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
        <span style={ts.minimalYear}>
          <EditableText elementKey="minimalYear">
            {invitation.date.year}
          </EditableText>
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
        <span style={ts.minimalDayOfWeek}>
          <EditableText elementKey="minimalDayOfWeek">
            {invitation.date.dayOfWeek}
          </EditableText>
        </span>
        <span style={{ color: ts.accent, opacity: 0.4, fontSize: 16 }}>·</span>
        <span style={ts.minimalTime}>
          <EditableText elementKey="minimalTime">
            {invitation.date.time}
          </EditableText>
        </span>
      </motion.div>

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        onCalendarClick={onCalendarClick}
        customTexts={ct}
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
  cardBorderRadius,
  onCalendarClick,
  isPreview,
  imageSettings,
  customTexts,
}: SaveTheDateProps) {
  // Merge per-section card overrides into theme so all variants pick them up
  const theme = {
    ...rawTheme,
    cardBg: cardBg || rawTheme.cardBg,
    cardBorder: cardBorder || rawTheme.cardBorder,
  };
  const style: SaveDateStyle = theme.saveDateStyle ?? "classic";

  switch (style) {
    case "countdown":
      return (
        <SaveTheDateCountdown
          invitation={invitation}
          theme={theme}
          ts={ts}
          cardBorderRadius={cardBorderRadius}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
          customTexts={customTexts}
        />
      );
    case "quad-cards":
      return (
        <SaveTheDateQuadCards
          invitation={invitation}
          theme={theme}
          ts={ts}
          cardBorderRadius={cardBorderRadius}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
          customTexts={customTexts}
        />
      );
    case "cinematic":
      return (
        <SaveTheDateCinematic
          invitation={invitation}
          theme={theme}
          ts={ts}
          cardBorderRadius={cardBorderRadius}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
          imageSettings={imageSettings}
          customTexts={customTexts}
        />
      );
    case "minimal-line":
      return (
        <SaveTheDateMinimalLine
          invitation={invitation}
          theme={theme}
          ts={ts}
          cardBorderRadius={cardBorderRadius}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
          customTexts={customTexts}
        />
      );
    case "classic":
    default:
      return (
        <SaveTheDateClassic
          invitation={invitation}
          theme={theme}
          ts={ts}
          cardBorderRadius={cardBorderRadius}
          onCalendarClick={onCalendarClick}
          isPreview={isPreview}
          customTexts={customTexts}
        />
      );
  }
}
