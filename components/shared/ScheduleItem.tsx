"use client";

import { motion } from "framer-motion";
import type { ScheduleEvent, TemplateTheme } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DirectProps {
  time: string;
  label: string;
  venue: string;
  accentColor: string;
  textColor: string;
  venueColor: string;
  /** UI font for labels (replaces hardcoded Inter) */
  uiFont: string;
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
  const accentColor = isIntegrationProps(props) ? props.theme.accent : props.accentColor;
  const textColor = isIntegrationProps(props) ? props.theme.textPrimary : props.textColor;
  const venueColor = isIntegrationProps(props) ? props.theme.textSecondary : props.venueColor;
  const uiFont = isIntegrationProps(props) ? props.theme.uiFont : props.uiFont;
  const index = isIntegrationProps(props) ? 0 : props.index;

  return (
    <motion.div
      className="flex items-start gap-4 px-5 py-4"
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      {/* Time column */}
      <div
        className="w-[60px] shrink-0 text-center"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: textColor,
        }}
      >
        <span className="text-lg font-semibold leading-tight">{time}</span>
      </div>

      {/* Vertical divider */}
      <div className="relative flex shrink-0 flex-col items-center self-stretch">
        <div
          className="h-full w-px"
          style={{ backgroundColor: accentColor }}
        />
        {/* Dot accent */}
        <div
          className="absolute top-1 h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Event info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className="text-sm font-semibold uppercase tracking-wide"
          style={{
            fontFamily: uiFont,
            fontVariantCaps: "all-small-caps",
            color: textColor,
          }}
        >
          {label}
        </span>
        <span
          className="text-sm"
          style={{
            fontFamily: uiFont,
            color: venueColor,
          }}
        >
          {venue}
        </span>
      </div>
    </motion.div>
  );
}
