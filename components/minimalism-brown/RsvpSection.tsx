"use client";

import dynamic from "next/dynamic";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import SectionTitle from "./SectionTitle";
import SectionCard from "./SectionCard";
import { Reveal } from "./motion";

// react-hook-form + zod ship only with this section, not the first load.
const RSVPForm = dynamic(() => import("@/components/shared/RSVPForm"), {
  ssr: false,
});

/** Anchor the guestbook's "send wishes" button scrolls to. */
export const MB_RSVP_ID = "mb-rsvp";

/**
 * The RSVP form, inline at the foot of the page.
 *
 * This layout has no confirm button anywhere above: the reception card's pill
 * adds the event to the calendar instead, and guests confirm here. The form is
 * repainted with the layout's tokens so it reads as one of its cards rather
 * than the shared modal's neutral grey.
 */
export default function RsvpSection({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);

  if (!invitation.rsvp?.enabled) return null;

  return (
    <Reveal
      as="section"
      id={MB_RSVP_ID}
      style={{ marginTop: t.gap.section, scrollMarginTop: t.gap.block }}
    >
      <SectionTitle theme={theme} textStyles={ts}>
        {ct("sectionTitle_rsvp")}
      </SectionTitle>
      <SectionCard theme={theme} style={{ marginTop: t.gap.block }}>
        <RSVPForm
          inline
          hideTitle
          invitation={invitation}
          theme={theme}
          customTexts={invitation.customTexts}
          guest={invitation.guest}
          paletteOverride={{
            fieldBg: mixWithTransparent("#FFFFFF", 78),
            border: mixWithTransparent(theme.primary, 22),
            text: theme.textPrimary,
            textSoft: theme.textSecondary,
            textMuted: theme.textMuted,
            accent: theme.primary,
            ctaBg: t.panel.bg,
            ctaText: t.panel.fg,
            iconColor: theme.textSecondary,
            displayFont: t.title.font,
            bodyFont: theme.bodyFont,
          }}
        />
      </SectionCard>
    </Reveal>
  );
}
