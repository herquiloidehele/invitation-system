"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens, mbTransport } from "@/lib/minimalism-brown";
import { EditableText } from "@/components/shared/EditableText";
import SectionCard from "./SectionCard";
import SectionTitle from "./SectionTitle";
import { Reveal } from "./motion";

/**
 * Transport notice: an image on top, then a title and a free-text
 * description, on the same warm card as the ceremony and schedule.
 *
 * The image is shown whole at its own proportions — hosts upload anything from
 * a small bus illustration to a photo, so the admin picks the width instead of
 * the layout cropping to a fixed frame.
 */
export default function TransportInfo({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const transport = mbTransport(invitation);
  if (!transport) return null;

  const { imageUrl, imageWidth, title, description } = transport;

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      <SectionCard theme={theme}>
        <div style={{ textAlign: "center" }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              style={{
                display: "block",
                width: imageWidth,
                height: "auto",
                marginInline: "auto",
                borderRadius: t.card.radius,
              }}
            />
          )}

          {title && (
            <SectionTitle
              theme={theme}
              textStyles={ts}
              style={{ marginTop: imageUrl ? t.gap.block : 0 }}
            >
              {title}
            </SectionTitle>
          )}

          {description && (
            <p
              style={mbStyle(
                {
                  margin: `${title || imageUrl ? t.gap.row : 0}px 0 0`,
                  fontFamily: t.title.font,
                  fontSize: 14,
                  fontWeight: 300,
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                  color: theme.textSecondary,
                },
                ts,
                "mbTransportText",
              )}
            >
              <EditableText elementKey="mbTransportText">
                {description}
              </EditableText>
            </p>
          )}
        </div>
      </SectionCard>
    </Reveal>
  );
}
