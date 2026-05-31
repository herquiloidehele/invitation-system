"use client";

import { motion } from "framer-motion";
import { EditableText } from "@/components/shared/EditableText";
import { EASE } from "@/components/shared/animations";
import { CalendarCTA, SaveLabel } from "./SaveTheDateShared";
import type { SaveTheDateVariantProps } from "./types";

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

export default function SaveTheDateMinimalLine({
  invitation,
  ts,
  onCalendarClick,
  customTexts: ct,
  isPreview,
}: SaveTheDateVariantProps) {
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
            {invitation.date.month}
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
            {invitation.date.dayOfWeek}
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
        onCalendarClick={onCalendarClick}
        customTexts={ct}
      />
    </div>
  );
}
