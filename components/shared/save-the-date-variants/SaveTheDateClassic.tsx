"use client";

import { motion } from "framer-motion";
import { EditableText } from "@/components/shared/EditableText";
import { EASE } from "@/components/shared/animations";
import { AccentLine, CalendarCTA, SaveLabel } from "./SaveTheDateShared";
import type { SaveTheDateVariantProps } from "./types";

// ---------------------------------------------------------------------------
// 1. Classic — the original single glassmorphism card
// ---------------------------------------------------------------------------

export default function SaveTheDateClassic({
  invitation,
  theme,
  ts,
  cardBorderRadius,
  onCalendarClick,
  customTexts: ct,
  isPreview,
}: SaveTheDateVariantProps) {
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
          {invitation.date.month}
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
          {invitation.date.dayOfWeek} &middot; {invitation.date.time}
        </EditableText>
      </motion.span>

      <motion.div variants={classicItem}>
        <CalendarCTA
          invitation={invitation}
          ts={ts}
          onCalendarClick={onCalendarClick}
          customTexts={ct}
        />
      </motion.div>
    </motion.div>
  );
}
