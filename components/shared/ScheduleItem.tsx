"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { ScheduleEvent, TemplateTheme } from "@/lib/types";
import { EditableText } from "./EditableText";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DirectProps {
  time: string;
  label: string;
  venue: string;
  accentColor: string;
  /** Resolved CSSProperties for the time column (font, color, size, weight …) */
  timeStyle: CSSProperties;
  /** Resolved CSSProperties for the event label */
  labelStyle: CSSProperties;
  /** Resolved CSSProperties for the venue name */
  venueStyle: CSSProperties;
  /** Index in the schedule list — drives staggered entrance delay */
  index: number;
}

interface IntegrationProps {
  event: ScheduleEvent;
  theme: TemplateTheme;
}

type ScheduleItemProps = DirectProps | IntegrationProps;

function isIntegrationProps(p: ScheduleItemProps): p is IntegrationProps {
  return "event" in p;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScheduleItem(props: ScheduleItemProps) {
  const time = isIntegrationProps(props) ? props.event.time : props.time;
  const label = isIntegrationProps(props) ? props.event.label : props.label;
  const venue = isIntegrationProps(props) ? props.event.venue : props.venue;

  // Accent color for decorative divider + dot
  const accentColor = isIntegrationProps(props)
    ? props.theme.accent
    : props.accentColor;

  // Per-element resolved styles (integration mode uses simple theme fallbacks)
  const timeStyle: CSSProperties = isIntegrationProps(props)
    ? {
        fontFamily: props.theme.scriptFont ?? "'Cormorant Garamond', serif",
        fontSize: 18,
        fontWeight: 600,
        lineHeight: 1.15,
        color: props.theme.textPrimary,
      }
    : props.timeStyle;

  const labelStyle: CSSProperties = isIntegrationProps(props)
    ? {
        fontFamily: props.theme.uiFont,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 0.5,
        color: props.theme.textPrimary,
      }
    : props.labelStyle;

  const venueStyle: CSSProperties = isIntegrationProps(props)
    ? {
        fontFamily: props.theme.uiFont,
        fontSize: 14,
        color: props.theme.textSecondary,
      }
    : props.venueStyle;

  const index = isIntegrationProps(props) ? 0 : props.index;

  return (
    <motion.div
      className="flex items-start gap-4 px-5 py-4"
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      {/* Time column */}
      <div className="w-[60px] shrink-0 text-center" style={timeStyle}>
        <EditableText elementKey="scheduleTime">
          <span className="leading-tight">{time}</span>
        </EditableText>
      </div>

      {/* Vertical divider */}
      <div className="relative flex shrink-0 flex-col items-center self-stretch">
        <motion.div
          className="w-px"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{
            duration: 0.7,
            delay: 0.2 + index * 0.08,
            ease: "easeOut",
          }}
          style={{
            backgroundColor: accentColor,
            height: "100%",
            transformOrigin: "top center",
          }}
        />
        {/* Dot accent — pulses subtly */}
        <motion.div
          className="absolute top-1 h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.4,
          }}
        />
      </div>

      {/* Event info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <EditableText elementKey="scheduleLabel">
          <span
            className="uppercase tracking-wide"
            style={{
              ...labelStyle,
              fontVariantCaps: "all-small-caps",
            }}
          >
            {label}
          </span>
        </EditableText>
        <EditableText elementKey="scheduleVenue">
          <span style={venueStyle}>{venue}</span>
        </EditableText>
      </div>
    </motion.div>
  );
}
