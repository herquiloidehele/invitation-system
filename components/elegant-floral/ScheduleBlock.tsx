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

      {/* The rows are centred, so the rail runs down the left of the list
          rather than through the middle of the text. The list keeps its own
          centring; only the rail lives in the gutter. */}
      <div ref={trackRef} style={{ position: "relative" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            // Full width: ScrollTimeline centres its own rail, so this puts
            // the stepper down the middle between the time and label columns.
            left: 0,
            right: 0,
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
                // minmax(0, …) rather than a bare 1fr: a bare fr floors at
                // min-content, so one long label widens its column and drags
                // the rail off the section's centre line.
                gridTemplateColumns: "minmax(0, 1fr) 28px minmax(0, 1fr)",
                alignItems: "center",
                columnGap: 10,
              }}
            >
              {/* Icon and time travel together, right-aligned as a group, so
                the rail stays on the section's centre line. */}
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

              {/* Gutter for the centred rail, drawn once for the whole list. */}
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
