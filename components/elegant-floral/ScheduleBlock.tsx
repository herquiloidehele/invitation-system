"use client";

import { motion } from "framer-motion";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import HeartDivider from "./HeartDivider";
import { efGroup, efItem, useRevealProps } from "./motion";

interface ScheduleBlockProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  title?: string;
}

/** Minimal centered timeline ("Cronograma"); rows stagger into view. */
export default function ScheduleBlock({
  invitation,
  theme,
  title = "Cronograma",
}: ScheduleBlockProps) {
  const reveal = useRevealProps();
  const ts = invitation.textStyles;
  const items = invitation.schedule ?? [];
  if (items.length === 0) return null;

  const labelStyle = efStyle(
    {
      margin: 0,
      fontFamily: theme.displayFont,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontSize: "clamp(0.92rem, 3.9vw, 1.12rem)",
      color: theme.textPrimary,
    },
    ts,
    "efScheduleLabel",
  );
  const timeStyle = efStyle(
    {
      margin: "0.25rem 0 0",
      fontFamily: theme.bodyFont,
      fontSize: "clamp(0.9rem, 3.6vw, 1.08rem)",
      color: theme.secondary,
    },
    ts,
    "efScheduleTime",
  );
  const venueStyle = efStyle(
    {
      margin: "0.1rem 0 0",
      fontFamily: theme.bodyFont,
      fontSize: "0.85rem",
      color: theme.textMuted,
    },
    ts,
    "efBody",
  );

  return (
    <motion.section
      style={{ textAlign: "center", padding: "2rem clamp(1.5rem, 7vw, 3rem)" }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem} className={"py-4"}>
        <ScriptTitle theme={theme} textStyles={ts}>
          {title}
        </ScriptTitle>
      </motion.div>
      <motion.div variants={efItem}>
        <HeartDivider color={theme.secondary} style={{ margin: "1.2rem auto 2rem" }} />
      </motion.div>

      <motion.div
        variants={efGroup}
        style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}
      >
        {items.map((ev, i) => (
          <motion.div key={`${ev.label}-${i}`} variants={efItem}>
            <p style={labelStyle}>
              <EditableText elementKey="efScheduleLabel">{ev.label}</EditableText>
            </p>
            {ev.time && (
              <p style={timeStyle}>
                <EditableText elementKey="efScheduleTime">{ev.time}</EditableText>
              </p>
            )}
            {ev.venue && (
              <p style={venueStyle}>
                <EditableText elementKey="efBody">{ev.venue}</EditableText>
              </p>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
