"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { shouldRenderCoupleGallery } from "@/lib/couple-gallery";
import { useCustomText } from "@/lib/custom-texts";
import {
  mbGuestPhotoUpload,
  mbStyle,
  mbTokens,
} from "@/lib/minimalism-brown";
import { EditableText } from "@/components/shared/EditableText";
import { Reveal } from "./motion";

/**
 * Invites guests to send the host their own photos: a line of text and a
 * button out to whatever platform the host collects them on.
 *
 * It sits directly under the gallery and reads as its closing line, but does
 * not depend on it — a host with no gallery photos can still ask for the
 * guests', so on its own it takes a full section's breathing room.
 */
export default function GuestPhotoUpload({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);
  const upload = mbGuestPhotoUpload(invitation);
  if (!upload) return null;

  const followsGallery = shouldRenderCoupleGallery(invitation);

  return (
    <Reveal
      as="section"
      style={{
        marginTop: followsGallery ? t.gap.block : t.gap.section,
        // Matches the gallery's own inset, so the two line up as one block.
        paddingInline: 24,
        textAlign: "center",
      }}
    >
      {upload.text && (
        <p
          style={mbStyle(
            {
              margin: `0 0 ${t.gap.row}px`,
              fontFamily: t.title.font,
              fontSize: 14,
              fontWeight: 300,
              lineHeight: 1.8,
              whiteSpace: "pre-line",
              color: theme.textSecondary,
            },
            ts,
            "mbPhotoShareText",
          )}
        >
          <EditableText elementKey="mbPhotoShareText">
            {upload.text}
          </EditableText>
        </p>
      )}

      <a
        href={upload.href}
        target="_blank"
        rel="noopener noreferrer"
        style={mbStyle(
          {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: t.title.font,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            color: t.panel.fg,
            backgroundColor: t.panel.bg,
            borderRadius: theme.ctaRadius,
            padding: "12px 24px",
            minHeight: 44,
          },
          ts,
          "mbPhotoShareButton",
        )}
      >
        <EditableText elementKey="mbPhotoShareButton">
          {ct("mb_sendPhotos")}
        </EditableText>
      </a>
    </Reveal>
  );
}
