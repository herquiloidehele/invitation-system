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
          ts={resolveTextStyles(theme, invitation.textStyles)}
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
