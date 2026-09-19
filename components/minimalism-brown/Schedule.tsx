"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { resolveTextStyles } from "@/lib/text-styles";
import { mbCardStyle } from "@/lib/minimalism-brown";
import { EditableText } from "@/components/shared/EditableText";
import SharedSchedule, {
  ScheduleIconGraphic,
} from "@/components/shared/ScheduleSection";
import SectionTitle from "./SectionTitle";
import SectionCard from "./SectionCard";
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

            {/* Connector: a continuous rule through the column with a dot per
                stop, which is how the reference threads its timeline. */}
            <span
              aria-hidden
              style={{
                position: "relative",
                alignSelf: "stretch",
                display: "block",
                minHeight: 46,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: i === 0 ? "50%" : 0,
                  bottom: i === events.length - 1 ? "50%" : 0,
                  width: 1,
                  transform: "translateX(-50%)",
                  backgroundColor: mixWithTransparent(theme.primary, 30),
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: theme.primary,
                }}
              />
            </span>

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
      </SectionCard>
    </Reveal>
  );
}
