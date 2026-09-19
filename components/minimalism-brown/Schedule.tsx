"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { useRef } from "react";
import { useCustomText } from "@/lib/custom-texts";
import { resolveTextStyles } from "@/lib/text-styles";
import { mbCardStyle, mbStyle, mbTokens } from "@/lib/minimalism-brown";
import { EditableText } from "@/components/shared/EditableText";
import SharedSchedule, {
  ScheduleIconGraphic,
} from "@/components/shared/ScheduleSection";
import SectionTitle from "./SectionTitle";
import SectionCard from "./SectionCard";
import ScrollTimeline from "@/components/shared/ScrollTimeline";
import { Sprig } from "./Decor";
import { Reveal, RevealGroup, RevealItem } from "./motion";

/**
 * Wedding-day timeline.
 *
 * Entries carrying an `iconUrl` render it as full-color artwork — this
 * template's illustrations are watercolour, not monochrome glyphs. Everything
 * else falls back to the platform's shared preset icon set rather than
 * declaring a second registry.
 */
export default function Schedule({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const events = invitation.schedule ?? [];
  if (events.length === 0) return null;

  // "Illustrated" is a platform style with its own layout; the connected
  // timeline below is this template's own and stands in for "default".
  if (invitation.scheduleStyle === "illustrated") {
    return (
      <Reveal as="section" style={{ marginTop: t.gap.section }}>
        <SectionCard theme={theme}>
          <SectionTitle theme={theme} textStyles={ts}>
            {ct("sectionTitle_schedule")}
          </SectionTitle>
          <div style={{ marginTop: t.gap.block }}>
            <SharedSchedule
              schedule={events}
              scheduleStyle="illustrated"
              theme={theme}
              ts={resolveTextStyles(theme, ts)}
              cardStyle={mbCardStyle(
                invitation.cardStyles,
                theme,
                "schedule",
                t.card.radius,
              )}
              customTexts={invitation.customTexts}
              isPreview
            />
          </div>
        </SectionCard>
      </Reveal>
    );
  }

  return (
    <Reveal
      as="section"
      style={{ marginTop: t.gap.section, position: "relative" }}
    >
      <Sprig
        theme={theme}
        width={104}
        index={4}
        style={{
          position: "absolute",
          right: 2,
          top: -84,
        }}
      />
      <SectionCard theme={theme}>
      <SectionTitle theme={theme} textStyles={ts}>
        {ct("sectionTitle_schedule")}
      </SectionTitle>

      <div ref={trackRef} style={{ position: "relative" }}>
        {/* One rail and one bloom for the whole list, positioned over the
            stop column (40px icon + 56px time + 8px gaps puts its centre at
            113px). Keep in step with gridTemplateColumns below. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 113,
            top: 23,
            bottom: 23,
            width: 0,
          }}
        >
          <ScrollTimeline
            theme={theme}
            containerRef={trackRef}
            markerImageUrl={invitation.scheduleMarkerUrl}
          />
        </div>

      <RevealGroup style={{ marginTop: t.gap.block }}>
        {events.map((event, i) => (
          <RevealItem
            key={event.id ?? `${event.time}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 56px 18px 1fr",
              alignItems: "center",
              columnGap: 8,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
              }}
            >
              {/* The platform's own icon set, tinted by the theme.
                  ScheduleIconGraphic also covers `icon: "custom"`, where it
                  masks the host's uploaded SVG in the theme colour — which is
                  what the admin promises ("cor herdada do tema"). Rendering
                  iconUrl as a full-colour image instead, as this did, broke
                  that contract and dropped stock artwork into the timeline. */}
              {event.icon ? (
                <ScheduleIconGraphic
                  icon={event.icon}
                  iconUrl={event.iconUrl}
                  color={theme.primary}
                  size={22}
                />
              ) : null}
            </span>

            <span
              style={mbStyle(
                {
                  fontFamily: t.title.font,
                  fontSize: 16,
                  fontWeight: 300,
                  letterSpacing: "0.4px",
                  color: theme.textPrimary,
                  textAlign: "right",
                },
                ts,
                "mbScheduleTime",
              )}
            >
              <EditableText elementKey="mbScheduleTime">
                {event.time}
              </EditableText>
            </span>

            {/* Spacer for the rail, which is drawn once for the whole list
                (see ScrollTimeline). The bloom is the only marker on it — the
                per-stop dots competed with the row icons for the same job. */}
            <span
              aria-hidden
              style={{ alignSelf: "stretch", display: "block", minHeight: 46 }}
            />

            <span
              style={mbStyle(
                {
                  fontFamily: t.title.font,
                  fontSize: 13,
                  fontWeight: 300,
                  color: theme.textSecondary,
                },
                ts,
                "mbScheduleLabel",
              )}
            >
              <EditableText elementKey="mbScheduleLabel">
                {event.label}
              </EditableText>
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
      </div>
      </SectionCard>
    </Reveal>
  );
}
