"use client";

import { motion } from "framer-motion";
import type { CustomTexts, InvitationData } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import CalendarButton from "@/components/shared/CalendarButton";
import { EditableText } from "@/components/shared/EditableText";
import { EASE, WordReveal } from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";

// ---------------------------------------------------------------------------
// Shared sub-components used by 2+ SaveTheDate variants
//
// Imported by each variant module from `./SaveTheDateShared`. Turbopack
// hoists this module into the common chunk graph, so it ships once
// regardless of which variant the invitation actually renders.
// ---------------------------------------------------------------------------

export function AccentLine({ ts }: { ts: ResolvedTextStyles }) {
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

export function SaveLabel({
  ts,
  customTexts: ct,
  isPreview,
}: {
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
  isPreview?: boolean;
}) {
  return (
    <span style={ts.saveLabel}>
      <EditableText elementKey="saveLabel">
        <WordReveal text={t(ct, "saveDate_label")} isPreview={isPreview} />
      </EditableText>
    </span>
  );
}

export function CalendarCTA({
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
      eventType={invitation.eventType}
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
