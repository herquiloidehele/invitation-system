"use client";

import { useLocale } from "next-intl";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import type { Wish } from "@/lib/minimalism-brown";
import { mbStyle, mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import SectionTitle from "./SectionTitle";
import { Reveal, RevealGroup, RevealItem } from "./motion";

/**
 * Public wishes wall, fed from the messages guests leave when they RSVP.
 *
 * Renders nothing when there are no wishes — an enabled-but-empty guestbook
 * shows no empty frame. The "leave a message" CTA points at the existing RSVP
 * flow rather than opening a second write path.
 */
export default function Guestbook({
  invitation,
  theme,
  wishes,
  onRsvpClick,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  wishes?: Wish[];
  onRsvpClick?: () => void;
}) {
  const locale = useLocale();
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);

  if (!wishes || wishes.length === 0) return null;

  // Formatted in the invitation's locale rather than the viewer's default, so
  // every guest sees the same date on the same card.
  const fmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      <SectionTitle theme={theme} textStyles={ts}>
        {invitation.guestbook?.title?.trim() || ct("sectionTitle_guestbook")}
      </SectionTitle>

      {invitation.rsvp?.enabled && onRsvpClick && (
        <div style={{ textAlign: "center", marginTop: t.gap.block }}>
          <button
            type="button"
            onClick={onRsvpClick}
            style={{
              fontFamily: t.title.font,
              fontSize: 14,
              fontWeight: 600,
              color: t.panel.fg,
              backgroundColor: t.panel.bg,
              border: "none",
              borderRadius: theme.ctaRadius,
              padding: "12px 24px",
              minHeight: 44,
              cursor: "pointer",
            }}
          >
            {ct("mb_sendWishes")}
          </button>
        </div>
      )}

      <RevealGroup
        style={{
          margin: `${t.gap.block}px 0 0`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {wishes.map((wish) => (
          <RevealItem
            key={wish.id}
            style={{
              backgroundColor: mixWithTransparent("#FFFFFF", 55),
              border: `1px solid ${mixWithTransparent(theme.primary, 12)}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span
                style={mbStyle(
                  {
                    fontFamily: t.title.font,
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.textPrimary,
                  },
                  ts,
                  "mbWishName",
                )}
              >
                {wish.guestName}
              </span>
              <span
                style={{
                  fontFamily: t.title.font,
                  fontSize: 12,
                  fontWeight: 300,
                  color: theme.textPrimary,
                  whiteSpace: "nowrap",
                }}
              >
                {fmt.format(wish.submittedAt)}
              </span>
            </div>

            <p
              style={mbStyle(
                {
                  margin: "6px 0 0",
                  fontFamily: t.title.font,
                  fontSize: 14,
                  fontWeight: 300,
                  lineHeight: 1.6,
                  color: theme.textPrimary,
                },
                ts,
                "mbWishBody",
              )}
            >
              {wish.message}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Reveal>
  );
}
