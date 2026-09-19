"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { resolveTextStyles } from "@/lib/text-styles";
import { mbCardStyle, mbTokens } from "@/lib/minimalism-brown";
import SharedSaveTheDate from "@/components/shared/SaveTheDateSection";
import SectionCard from "./SectionCard";
import { Reveal } from "./motion";

/**
 * Save the Date, in whichever of the six styles the host picked.
 *
 * The reference template has no such section, so everything here comes from
 * the platform's own component — all this adds is the card and spacing that
 * make it sit in the same system as the sections around it. Rebuilding the
 * styles bespoke would have meant six more variants to keep in step.
 */
export default function SaveTheDate({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  // No gate: the platform treats this as a required section — the mapper
  // defaults saveDateStyle to "classic" and the form offers no "none", so
  // every invitation has one. The style only chooses how it is presented.

  // The shared section colours its "Save the Date" eyebrow and calendar link
  // with the theme accent. That gold is a decorative tone — at 10px it lands
  // near 2:1 on this card, far below AA — so those two labels take the body
  // text colour here. The accent itself is untouched and still used where it
  // is decoration rather than text.
  const resolved = resolveTextStyles(theme, invitation.textStyles);
  const stdTextStyles = {
    ...resolved,
    saveLabel: { ...resolved.saveLabel, color: theme.textSecondary },
    calendarCta: { ...resolved.calendarCta, color: theme.textSecondary },
  };

  const card = mbCardStyle(
    invitation.cardStyles,
    theme,
    "saveTheDate",
    t.card.radius,
  );

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      {/* Textured like every other card on this page — the shared section is
          rendered `plain`, so its own surface is transparent and the paper
          shows through. */}
      <SectionCard theme={theme}>
        <SharedSaveTheDate
          invitation={invitation}
          theme={theme}
          ts={stdTextStyles}
          cardBg={card.cardBg}
          cardBorder={card.cardBorder}
          cardBorderRadius={card.borderRadius}
          plain
          // Rendered outright: the shared styles reveal on their own terms and
          // our Reveal above already owns the entrance.
          isPreview
          imageSettings={invitation.imageSettings}
          customTexts={invitation.customTexts}
        />
      </SectionCard>
    </Reveal>
  );
}
