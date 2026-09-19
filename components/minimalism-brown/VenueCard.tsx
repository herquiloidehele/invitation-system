"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { resolveLocationPhotos } from "@/lib/elegant-floral";
import { useCustomText } from "@/lib/custom-texts";
import { EditableText } from "@/components/shared/EditableText";
import { Reveal } from "./motion";
import { HouseBackdrop } from "./Decor";

/**
 * Reception venue with its address and a directions link.
 *
 * Photos come through the shared resolveLocationPhotos so an invitation saved
 * with the legacy single `imageUrl` still shows its picture.
 */
export default function VenueCard({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);
  const venue = invitation.location2 ?? invitation.location;
  if (!venue?.name) return null;

  const photo = resolveLocationPhotos(venue)[0];
  const mapUrl = venue.googleMapsUrl || venue.wazeUrl;

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section, position: "relative" }}>
      <HouseBackdrop top="52%" width={560} opacity={0.14} />
      <div
        style={{
          backgroundColor: photo ? t.card.bg : "transparent",
          borderRadius: t.card.radius,
          overflow: "hidden",
          border: photo
            ? `1px solid ${mixWithTransparent(theme.primary, 12)}`
            : "none",
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.src}
            alt=""
            loading="lazy"
            style={{
              width: "100%",
              aspectRatio: "16 / 10",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        <div style={{ padding: t.card.pad, textAlign: "center" }}>
          <h3
            style={mbStyle(
              {
                margin: 0,
                fontFamily: t.title.font,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.48px",
                textTransform: "uppercase",
                color: theme.textPrimary,
              },
              ts,
              "mbVenueLine",
            )}
          >
            <EditableText elementKey="mbVenueLine">{venue.name}</EditableText>
          </h3>

          {venue.address && (
            <p
              style={{
                margin: `${t.gap.row}px 0 0`,
                fontFamily: theme.bodyFont,
                fontSize: 12,
                fontWeight: 300,
                lineHeight: 1.7,
                color: theme.textSecondary,
              }}
            >
              {venue.address}
            </p>
          )}

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 44,
                padding: "0 16px",
                marginTop: t.gap.block - 10,
                fontFamily: theme.bodyFont,
                fontSize: 14,
                fontWeight: 600,
                color: theme.textSecondary,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              {ct("cta_openMap")}
            </a>
          )}
        </div>
      </div>
    </Reveal>
  );
}
