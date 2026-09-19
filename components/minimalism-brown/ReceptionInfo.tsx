"use client";

import type { CSSProperties } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { EditableText } from "@/components/shared/EditableText";
import CalendarButton from "@/components/shared/CalendarButton";
import SectionTitle from "./SectionTitle";
import SectionCard from "./SectionCard";
import MonthCalendar from "./MonthCalendar";
import { Reveal } from "./motion";
import { LeafWatermark } from "./Decor";

/**
 * Reception block.
 *
 * Structured as the reference is: a warm card carrying the whole section, with
 * the brown fill scoped to the month calendar and the confirm pill rather than
 * flooding the section. Inverting that — as this template first did — changes
 * the weight of the entire page.
 */
export default function ReceptionInfo({
  invitation,
  theme,
  onRsvpClick,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  onRsvpClick?: () => void;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);
  const venue = invitation.location2 ?? invitation.location;

  const intro: CSSProperties = {
    margin: 0,
    textAlign: "center",
    fontFamily: theme.bodyFont,
    fontSize: 20,
    fontWeight: 400,
    textTransform: "uppercase",
    color: theme.textPrimary,
  };

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      <SectionCard theme={theme}>
        <LeafWatermark
          side="right"
          top="18%"
          width={150}
          opacity={0.55}
          index={3}
          depth={0.04}
          layer={20}
        />
        <SectionTitle theme={theme} textStyles={ts}>
          {ct("sectionTitle_receptionInfo")}
        </SectionTitle>

        <p style={{ ...intro, marginTop: t.gap.block }}>
          <EditableText elementKey="mbVenueLine">
            {ct("mb_receptionIntro")}
          </EditableText>
        </p>

        <p
          style={mbStyle(
            {
              ...intro,
              marginTop: 14,
              fontWeight: 300,
              textTransform: "none",
              color: theme.textSecondary,
            },
            ts,
            "mbTimeValue",
          )}
        >
          <EditableText elementKey="mbTimeValue">{venue.name}</EditableText>
        </p>

        {/* The brown fill belongs to the calendar alone. */}
        <div
          style={{
            marginTop: t.gap.block,
            marginInline: "auto",
            width: "100%",
            backgroundColor: t.panel.bg,
            borderRadius: t.panel.radius,
            padding: "8px 16px 16px",
            overflow: "hidden",
          }}
        >
          <MonthCalendar
            iso={invitation.date.iso}
            theme={theme}
            color={t.panel.fg}
          />
        </div>

        <div
          style={{
            marginTop: t.gap.block,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {invitation.showCalendarCta !== false && (
            <CalendarButton
              date={invitation.date}
              location={venue}
              couple={invitation.couple}
              eventType={invitation.eventType}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: theme.bodyFont,
                fontSize: 14,
                fontWeight: 300,
                color: theme.textPrimary,
                background: "transparent",
                border: "none",
                textDecoration: "underline",
                textUnderlineOffset: 4,
                padding: "0 12px",
                minHeight: 44,
                cursor: "pointer",
              }}
            >
              {ct("cta_addToCalendar")}
            </CalendarButton>
          )}

          {invitation.rsvp?.enabled && onRsvpClick && (
            <button
              type="button"
              onClick={onRsvpClick}
              style={{
                fontFamily: theme.bodyFont,
                fontSize: 14,
                fontWeight: 300,
                letterSpacing: "0.35px",
                textTransform: "uppercase",
                color: t.panel.fg,
                backgroundColor: t.panel.bg,
                border: "none",
                borderRadius: theme.ctaRadius,
                padding: "12px 24px",
                minHeight: 44,
                cursor: "pointer",
              }}
            >
              {ct("cta_confirmButton")}
            </button>
          )}
        </div>
      </SectionCard>
    </Reveal>
  );
}
