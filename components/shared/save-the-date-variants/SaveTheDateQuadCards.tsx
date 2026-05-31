"use client";

import { motion } from "framer-motion";
import { EditableText } from "@/components/shared/EditableText";
import { EASE } from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import type { TemplateTheme } from "@/lib/types";
import { CalendarCTA, SaveLabel } from "./SaveTheDateShared";
import type { SaveTheDateVariantProps } from "./types";

// ---------------------------------------------------------------------------
// 3. Quad Cards — 2×2 grid of 4 glassmorphism tiles
// ---------------------------------------------------------------------------

function QuadCard({
  label,
  value,
  theme,
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

export default function SaveTheDateQuadCards({
  invitation,
  theme,
  ts,
  onCalendarClick,
  customTexts: ct,
  isPreview,
}: SaveTheDateVariantProps) {
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
          onCalendarClick={onCalendarClick}
          customTexts={ct}
        />
      </motion.div>
    </div>
  );
}
