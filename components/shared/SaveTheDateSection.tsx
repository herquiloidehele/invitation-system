"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type {
  CustomTexts,
  ImageSettingsMap,
  InvitationData,
  SaveDateStyle,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { getImageStyle } from "@/lib/image-settings";
import { useCustomText } from "@/lib/custom-texts";
import {
  computeCountdownTimeLeft,
  formatCountdownValue,
  type CountdownTimeLeft,
} from "@/lib/countdown";
import {
  formatLocalizedDayOfWeek,
  formatLocalizedMonthLong,
} from "@/lib/date-format";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import CalendarButton from "./CalendarButton";
import { EditableText } from "./EditableText";
import { EASE, WordReveal } from "./animations";

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
  /** Per-section card border-radius override. Falls back to per-variant default. */
  cardBorderRadius?: number;
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
      viewport={{ once: false }}
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
  isPreview,
}: {
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
  isPreview?: boolean;
}) {
  const t = useCustomText(ct);
  return (
    <span style={ts.saveLabel}>
      <EditableText elementKey="saveLabel">
        <WordReveal text={t("saveDate_label")} isPreview={isPreview} />
      </EditableText>
    </span>
  );
}

function CalendarCTA({
  invitation,
  ts,
  customTexts: ct,
}: {
  invitation: InvitationData;
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
}) {
  const t = useCustomText(ct);
  return (
    <CalendarButton
      date={invitation.date}
      location={invitation.location}
      couple={invitation.couple}
      eventType={invitation.eventType}
      className="mt-5 flex items-center justify-center gap-2 px-5 py-2 transition-all"
    >
      <span style={ts.calendarCta}>
        <EditableText elementKey="calendarCta">
          {t("cta_addToCalendar")}
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
  customTexts: ct,
  isPreview,
}: SaveTheDateProps) {
  const locale = useLocale();
  const monthDisplay = formatLocalizedMonthLong(
    invitation.date.iso,
    locale,
    invitation.date.month,
  );
  const dayOfWeekDisplay = formatLocalizedDayOfWeek(
    invitation.date.iso,
    locale,
    invitation.date.dayOfWeek,
  );
  const classicCascade = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };
  const classicItem = {
    hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: EASE },
    },
  };
  return (
    <motion.div
      className="relative flex flex-col items-center text-center"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
      variants={classicCascade}
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: false, margin: "-60px" },
          })}
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
      <SaveLabel ts={ts} customTexts={ct} isPreview={isPreview} />

      {/* Day — oversized */}
      <motion.span className="mt-3" style={ts.dateDay} variants={classicItem}>
        <EditableText elementKey="dateDay">{invitation.date.day}</EditableText>
      </motion.span>

      {/* Month */}
      <motion.span
        className="mt-1"
        style={ts.dateMonth}
        variants={classicItem}
      >
        <EditableText elementKey="dateMonth">
          {monthDisplay}
        </EditableText>
      </motion.span>

      {/* Year */}
      <motion.span className="mt-1" style={ts.dateYear} variants={classicItem}>
        <EditableText elementKey="dateYear">
          {invitation.date.year}
        </EditableText>
      </motion.span>

      <AccentLine ts={ts} />

      {/* Day of week + time */}
      <motion.span style={ts.dateTime} variants={classicItem}>
        <EditableText elementKey="dateTime">
          {dayOfWeekDisplay} &middot; {invitation.date.time}
        </EditableText>
      </motion.span>

      <motion.div variants={classicItem}>
        <CalendarCTA
          invitation={invitation}
          ts={ts}
          customTexts={ct}
        />
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 2. Countdown — live ticking timer to the wedding date
// ---------------------------------------------------------------------------

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
  const formatted = formatCountdownValue(value);
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{
          background: theme.cardBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 12,
          padding: "14px 10px",
          minWidth: 58,
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <span
          style={{
            ...ts.countdownValue,
            display: "block",
            textAlign: "center",
            position: "relative",
          }}
        >
          <EditableText elementKey="countdownValue">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={formatted}
                initial={{ y: "60%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-60%", opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ display: "inline-block" }}
              >
                {formatted}
              </motion.span>
            </AnimatePresence>
          </EditableText>
        </span>
      </motion.div>
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
  customTexts: ct,
  isPreview,
}: SaveTheDateProps) {
  const t = useCustomText(ct);
  const locale = useLocale();
  const monthDisplay = formatLocalizedMonthLong(
    invitation.date.iso,
    locale,
    invitation.date.month,
  );
  const dayOfWeekDisplay = formatLocalizedDayOfWeek(
    invitation.date.iso,
    locale,
    invitation.date.dayOfWeek,
  );
  const [timeLeft, setTimeLeft] = useState<CountdownTimeLeft>(() =>
    computeCountdownTimeLeft(invitation.date.iso, invitation.date.time),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(
        computeCountdownTimeLeft(invitation.date.iso, invitation.date.time),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [invitation.date.iso, invitation.date.time]);

  const isCelebration =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;
  const displayName = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: invitation.couple.bride,
    secondaryName: invitation.couple.groom,
  });

  return (
    <motion.div
      className="relative flex flex-col items-center text-center"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
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
      <SaveLabel ts={ts} customTexts={ct} isPreview={isPreview} />

      {/* Date context */}
      <span className="mt-3" style={ts.countdownDate}>
        <EditableText elementKey="countdownDate">
          {invitation.date.day} · {monthDisplay} ·{" "}
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
          {dayOfWeekDisplay} &middot; {invitation.date.time}
        </EditableText>
      </span>

      <AccentLine ts={ts} />

      {/* Countdown tiles */}
      {isCelebration ? (
        <div className="flex flex-col items-center gap-2 py-3">
          <span style={ts.celebrationTitle}>
            <EditableText elementKey="celebrationTitle">
              {t("saveDate_celebrationTitle")}
            </EditableText>
          </span>
          <span style={ts.celebrationCouple}>
            <EditableText elementKey="celebrationCouple">
              {displayName}
            </EditableText>
          </span>
        </div>
      ) : (
        <div className="flex items-start justify-center gap-1">
          <CountdownUnit
            value={timeLeft.days}
            label={t("saveDate_days")}
            theme={theme}
            ts={ts}
          />
          <CountdownColon ts={ts} delay={0} />
          <CountdownUnit
            value={timeLeft.hours}
            label={t("saveDate_hours")}
            theme={theme}
            ts={ts}
          />
          <CountdownColon ts={ts} delay={0.3} />
          <CountdownUnit
            value={timeLeft.minutes}
            label={t("saveDate_minutes")}
            theme={theme}
            ts={ts}
          />
          <CountdownColon ts={ts} delay={0.6} />
          <CountdownUnit
            value={timeLeft.seconds}
            label={t("saveDate_seconds")}
            theme={theme}
            ts={ts}
          />
        </div>
      )}

      <CalendarCTA
        invitation={invitation}
        ts={ts}
        customTexts={ct}
      />
    </motion.div>
  );
}

function CountdownColon({
  ts,
  delay,
}: {
  ts: ResolvedTextStyles;
  delay: number;
}) {
  return (
    <motion.span
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      style={{
        fontFamily: ts.scriptFont,
        fontSize: 36,
        color: ts.accent,
        lineHeight: 1,
        marginTop: 10,
      }}
    >
      :
    </motion.span>
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
  theme: TemplateTheme;
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
      viewport={{ once: false }}
      whileHover={{ y: -4, scale: 1.02 }}
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
        cursor: "default",
      }}
    >
      <motion.span
        style={valueStyle}
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5, delay: delay + 0.15, ease: EASE }}
      >
        <EditableText elementKey={`${elementKey}Value`}>{value}</EditableText>
      </motion.span>
      <motion.span
        style={labelStyle}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5, delay: delay + 0.3, ease: EASE }}
      >
        <EditableText elementKey={`${elementKey}Label`}>{label}</EditableText>
      </motion.span>
    </motion.div>
  );
}

function SaveTheDateQuadCards({
  invitation,
  theme,
  ts,
  cardBorderRadius: _cardBorderRadius,
  customTexts: ct,
  isPreview,
}: SaveTheDateProps) {
  const t = useCustomText(ct);
  const locale = useLocale();
  const monthDisplay = formatLocalizedMonthLong(
    invitation.date.iso,
    locale,
    invitation.date.month,
  );
  const dayOfWeekDisplay = formatLocalizedDayOfWeek(
    invitation.date.iso,
    locale,
    invitation.date.dayOfWeek,
  );
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header label */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <SaveLabel ts={ts} customTexts={ct} isPreview={isPreview} />
      </motion.div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <QuadCard
          label={t("saveDate_dayLabel")}
          value={invitation.date.day}
          theme={theme}
          ts={ts}
          delay={0.05}
          elementKey="quadDay"
          valueStyle={ts.quadDayValue}
          labelStyle={ts.quadDayLabel}
        />
        <QuadCard
          label={t("saveDate_monthLabel")}
          value={monthDisplay}
          theme={theme}
          ts={ts}
          delay={0.1}
          elementKey="quadMonth"
          valueStyle={ts.quadMonthValue}
          labelStyle={ts.quadMonthLabel}
        />
        <QuadCard
          label={t("saveDate_yearLabel")}
          value={invitation.date.year}
          theme={theme}
          ts={ts}
          delay={0.15}
          elementKey="quadYear"
          valueStyle={ts.quadYearValue}
          labelStyle={ts.quadYearLabel}
        />
        <QuadCard
          label={t("saveDate_dayOfWeekLabel")}
          value={dayOfWeekDisplay}
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
        viewport={{ once: false }}
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
  imageSettings,
  customTexts: ct,
  isPreview,
}: SaveTheDateProps) {
  const t = useCustomText(ct);
  const locale = useLocale();
  const monthDisplay = formatLocalizedMonthLong(
    invitation.date.iso,
    locale,
    invitation.date.month,
  );
  const dayOfWeekDisplay = formatLocalizedDayOfWeek(
    invitation.date.iso,
    locale,
    invitation.date.dayOfWeek,
  );
  const bgImage =
    invitation.cinematicImageUrl?.trim() || CINEMATIC_DEFAULT_IMAGE;
  const cinematicImgStyle = getImageStyle(imageSettings, "cinematicImage");
  const displayName = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: invitation.couple.bride,
    secondaryName: invitation.couple.groom,
  });

  return (
    <motion.div
      className="relative flex flex-col items-center overflow-hidden"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
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
        {/* Background image — rendered via next/image so it gets WebP
            transcoding, responsive `srcset`, and CDN-friendly optimisation
            instead of shipping the original asset bytes. The
            `cinematicImgStyle` admin overrides are forwarded as inline
            CSS (objectPosition / transform) on the underlying <img>. */}
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.4, ease: EASE }}
          style={{
            position: "absolute",
            inset: 0,
            ...(cinematicImgStyle.transform
              ? {
                  transform: cinematicImgStyle.transform,
                  transformOrigin:
                    cinematicImgStyle.transformOrigin as string,
                }
              : {}),
          }}
        >
          <Image
            src={bgImage}
            alt=""
            aria-hidden
            fill
            // Invitation column caps at 500 px; cinematic variant fills it.
            sizes="(max-width: 500px) 100vw, 500px"
            priority={false}
            style={{
              objectFit: "cover",
              objectPosition:
                (cinematicImgStyle.objectPosition as string | undefined) ??
                "center",
            }}
          />
        </motion.div>

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
          viewport={{ once: false }}
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
              <WordReveal
                text={t("saveDate_label")}
                isPreview={isPreview}
              />
            </EditableText>
          </span>

          {/* Script couple names */}
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
            className="mt-3 text-center"
            style={ts.cinematicCouple}
          >
            <EditableText elementKey="cinematicCouple">
              {displayName}
            </EditableText>
          </motion.span>

          {/* Thin accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
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
                {monthDisplay}
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
                {dayOfWeekDisplay}
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
            customTexts={ct}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 5. Minimal Line — horizontal inline, no card background
// ---------------------------------------------------------------------------

function MinimalSeparator({
  accent,
  delay,
}: {
  accent: string;
  delay: number;
}) {
  return (
    <motion.span
      animate={{ opacity: [0.25, 0.6, 0.25] }}
      transition={{
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      style={{
        color: accent,
        fontSize: 28,
        fontWeight: 200,
      }}
    >
      ·
    </motion.span>
  );
}

function SaveTheDateMinimalLine({
  invitation,
  ts,
  cardBorderRadius: _cardBorderRadius,
  customTexts: ct,
  isPreview,
}: SaveTheDateProps) {
  const locale = useLocale();
  const monthDisplay = formatLocalizedMonthLong(
    invitation.date.iso,
    locale,
    invitation.date.month,
  );
  const dayOfWeekDisplay = formatLocalizedDayOfWeek(
    invitation.date.iso,
    locale,
    invitation.date.dayOfWeek,
  );
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <SaveLabel ts={ts} customTexts={ct} isPreview={isPreview} />
      </motion.div>

      {/* Main date line — large, spaced */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1"
      >
        <span style={ts.minimalDay}>
          <EditableText elementKey="minimalDay">
            {invitation.date.day}
          </EditableText>
        </span>
        <MinimalSeparator accent={ts.accent} delay={0} />
        <span style={ts.minimalMonth}>
          <EditableText elementKey="minimalMonth">
            {monthDisplay}
          </EditableText>
        </span>
        <MinimalSeparator accent={ts.accent} delay={0.5} />
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
        viewport={{ once: false }}
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
        viewport={{ once: false }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
        className="flex items-center gap-3"
      >
        <span style={ts.minimalDayOfWeek}>
          <EditableText elementKey="minimalDayOfWeek">
            {dayOfWeekDisplay}
          </EditableText>
        </span>
        <motion.span
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          style={{ color: ts.accent, fontSize: 16 }}
        >
          ·
        </motion.span>
        <span style={ts.minimalTime}>
          <EditableText elementKey="minimalTime">
            {invitation.date.time}
          </EditableText>
        </span>
      </motion.div>

      <CalendarCTA
        invitation={invitation}
        ts={ts}
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
  const style: SaveDateStyle = invitation.saveDateStyle ?? "classic";

  switch (style) {
    case "countdown":
      return (
        <SaveTheDateCountdown
          invitation={invitation}
          theme={theme}
          ts={ts}
          cardBorderRadius={cardBorderRadius}
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
          isPreview={isPreview}
          customTexts={customTexts}
        />
      );
  }
}
