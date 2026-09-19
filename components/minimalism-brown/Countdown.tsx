"use client";

import { useEffect, useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { countdownPartsFrom } from "@/lib/elegant-floral";
import { mbStyle, mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { EditableText } from "@/components/shared/EditableText";
import SectionTitle from "./SectionTitle";
import { PaperTexture } from "./SectionCard";
import { Reveal, RevealGroup, RevealItem, mbPop } from "./motion";

/**
 * Countdown in this template's own language.
 *
 * The shared ExternalCountdownSection brings its own script heading, card
 * styling and a duplicate add-to-calendar link — on this page that reads as a
 * section borrowed from somewhere else, and its pale-on-pale CTA repeats the
 * one already in the reception panel. This renders the same data through
 * mbTokens instead, so it sits in the same system as everything around it.
 */
export default function Countdown({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ct = useCustomText(invitation.customTexts);
  const [parts, setParts] = useState(() =>
    countdownPartsFrom(invitation.date.iso, Date.now()),
  );

  useEffect(() => {
    const tick = () =>
      setParts(countdownPartsFrom(invitation.date.iso, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [invitation.date.iso]);

  if (parts.done) return null;

  const config = invitation.countdown;
  const cells = [
    { value: parts.days, label: ct("saveDate_days") },
    { value: parts.hours, label: ct("saveDate_hours") },
    { value: parts.minutes, label: ct("saveDate_minutes") },
    { value: parts.seconds, label: ct("saveDate_seconds") },
  ];

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      <SectionTitle theme={theme} textStyles={invitation.textStyles}>
        {config?.title || ct("countdown_defaultTitle")}
      </SectionTitle>

      {(config?.subtitle || ct("countdown_defaultSubtitle")) && (
        <p
          style={{
            margin: `${t.gap.row}px 0 0`,
            textAlign: "center",
            fontFamily: theme.bodyFont,
            fontSize: 14,
            fontWeight: 300,
            color: theme.textSecondary,
          }}
        >
          {config?.subtitle || ct("countdown_defaultSubtitle")}
        </p>
      )}

      <RevealGroup
        style={{
          marginTop: t.gap.block,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {cells.map((cell) => (
          <RevealItem key={cell.label} variant={mbPop}>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                backgroundColor: t.card.bg,
                border: `1px solid ${mixWithTransparent(theme.primary, 14)}`,
                borderRadius: t.card.radius,
                padding: "14px 4px",
                textAlign: "center",
              }}
            >
              {/* Same grain scale as a full-width section card. */}
              <PaperTexture size="343px auto" />
              <div
                style={mbStyle(
                  {
                    position: "relative",
                    fontFamily: theme.displayFont,
                    fontSize: 26,
                    fontWeight: 400,
                    lineHeight: 1.1,
                    color: theme.textPrimary,
                    fontVariantNumeric: "tabular-nums",
                  },
                  invitation.textStyles,
                  "mbCountdownValue",
                )}
              >
                <EditableText elementKey="mbCountdownValue">
                  {String(cell.value).padStart(2, "0")}
                </EditableText>
              </div>
              <div
                style={mbStyle(
                  {
                    position: "relative",
                    marginTop: 4,
                    fontFamily: t.eyebrow.font,
                    fontSize: t.eyebrow.size,
                    letterSpacing: `${t.eyebrow.tracking}px`,
                    textTransform: "uppercase",
                    color: theme.textSecondary,
                  },
                  invitation.textStyles,
                  "mbCountdownLabel",
                )}
              >
                <EditableText elementKey="mbCountdownLabel">
                  {cell.label}
                </EditableText>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Reveal>
  );
}
