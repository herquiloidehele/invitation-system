"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EditableText } from "@/components/shared/EditableText";
import { EASE } from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";
import {
  computeCountdownTimeLeft,
  formatCountdownValue,
  type CountdownTimeLeft,
} from "@/lib/countdown";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import type { TemplateTheme } from "@/lib/types";
import { AccentLine, CalendarCTA, SaveLabel } from "./SaveTheDateShared";
import type { SaveTheDateVariantProps } from "./types";

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

export default function SaveTheDateCountdown({
  invitation,
  theme,
  ts,
  cardBorderRadius,
  onCalendarClick,
  customTexts: ct,
  isPreview,
}: SaveTheDateVariantProps) {
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
              {displayName}
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
          <CountdownColon ts={ts} delay={0} />
          <CountdownUnit
            value={timeLeft.hours}
            label={t(ct, "saveDate_hours")}
            theme={theme}
            ts={ts}
          />
          <CountdownColon ts={ts} delay={0.3} />
          <CountdownUnit
            value={timeLeft.minutes}
            label={t(ct, "saveDate_minutes")}
            theme={theme}
            ts={ts}
          />
          <CountdownColon ts={ts} delay={0.6} />
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
    </motion.div>
  );
}
