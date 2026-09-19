"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import ScrollTimeline from "@/components/shared/ScrollTimeline";
import { ScheduleIconGraphic } from "@/components/shared/ScheduleSection";
import { efGroup, efItem, useRevealProps } from "./motion";

/** Gutter the rail runs down, and how far left of centre that gutter sits. */
const RAIL_WIDTH = 28;
const RAIL_SHIFT = 28;
/** Space either side of the gutter; the grid arithmetic below depends on it. */
const COLUMN_GAP = 10;
/** Half the gutter plus one gap — what each outer column gives up at the row's centre. */
const EDGE = RAIL_WIDTH / 2 + COLUMN_GAP;

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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const ts = invitation.textStyles;
  const items = invitation.schedule ?? [];
  if (items.length === 0) return null;

  const labelStyle = efStyle(
    {
      margin: 0,
      fontFamily: theme.displayFont,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontSize: "clamp(0.78rem, 3.2vw, 0.96rem)",
      color: theme.textPrimary,
      overflowWrap: "break-word",
    },
    ts,
    "efScheduleLabel",
  );
  const timeStyle = efStyle(
    {
      margin: 0,
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
      overflowWrap: "break-word",
    },
    ts,
    "efBody",
  );

  return (
    <motion.section
      style={{
        textAlign: "center",
        padding: "2rem clamp(1rem, 4.5vw, 1.75rem)",
      }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div
        variants={efItem}
        className={"py-4"}
        style={{ marginBottom: "1.5rem" }}
      >
        <ScriptTitle theme={theme} textStyles={ts}>
          {title}
        </ScriptTitle>
      </motion.div>

      {/* Rail down the middle of the list, a touch left of the section's
          centre line: the left column only ever holds an icon and "HH:MM"
          while labels wrap, so the slack is worth more on the right. */}
      <div ref={trackRef} style={{ position: "relative" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            // ScrollTimeline centres its rail in this box, so pulling the
            // right edge in by twice the shift moves the rail left by the
            // shift — keeping it on the grid gutter below.
            left: 0,
            right: RAIL_SHIFT * 2,
            top: 14,
            bottom: 14,
          }}
        >
          <ScrollTimeline
            theme={theme}
            containerRef={trackRef}
            markerImageUrl={invitation.scheduleMarkerUrl}
            markerSize={30}
          />
        </div>

        <motion.div
          variants={efGroup}
          style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}
        >
          {items.map((ev, i) => (
            <motion.div
              key={`${ev.label}-${i}`}
              variants={efItem}
              style={{
                display: "grid",
                // Percentages, not fr: a bare fr floors at min-content, so one
                // long label would widen its column and drag the gutter off
                // the rail. Each side is half the row less its own gap and
                // half the gutter, then RAIL_SHIFT off the centre line.
                gridTemplateColumns: `minmax(0, calc(50% - ${EDGE + RAIL_SHIFT}px)) ${RAIL_WIDTH}px minmax(0, calc(50% - ${EDGE - RAIL_SHIFT}px))`,
                alignItems: "center",
                columnGap: COLUMN_GAP,
              }}
            >
              {/* Icon and time travel together, right-aligned as a group, so
                they hug the rail however short the time is. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 20,
                    display: "grid",
                    placeItems: "center",
                    flex: "none",
                  }}
                >
                  {ev.icon && (
                    <ScheduleIconGraphic
                      icon={ev.icon}
                      iconUrl={ev.iconUrl}
                      color={theme.secondary}
                      size={20}
                    />
                  )}
                </span>
                <span style={{ minWidth: 44, textAlign: "right" }}>
                  {ev.time && (
                    <p style={timeStyle}>
                      <EditableText elementKey="efScheduleTime">
                        {ev.time}
                      </EditableText>
                    </p>
                  )}
                </span>
              </div>

              {/* Gutter the rail runs through, drawn once for the whole list. */}
              <span aria-hidden style={{ display: "block", minHeight: 34 }} />

              <div style={{ textAlign: "left" }}>
                <p style={labelStyle}>
                  <EditableText elementKey="efScheduleLabel">
                    {ev.label}
                  </EditableText>
                </p>
                {ev.venue && (
                  <p style={venueStyle}>
                    <EditableText elementKey="efBody">{ev.venue}</EditableText>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
