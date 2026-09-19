"use client";

import { useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { resolveTextStyles } from "@/lib/text-styles";
import { useCustomText } from "@/lib/custom-texts";
import {
  mbCardStyle,
  mbTokens,
  mixWithTransparent,
} from "@/lib/minimalism-brown";
import GiftsSection from "@/components/shared/GiftsSection";
import SectionTitle from "./SectionTitle";
import { Reveal, useIdle } from "./motion";
import { HouseBackdrop } from "./Decor";

const GIFTBOX = {
  src: "/images/themes/minimalism-brown/giftbox.webp",
  w: 480,
  h: 504,
};

/**
 * Gift registry behind a tap-to-open illustration.
 *
 * Presentation only: the registry content, reservations and the standalone
 * /{slug}/gifts route all stay with the shared GiftsSection.
 */
export default function GiftBox({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const [open, setOpen] = useState(false);
  const t = mbTokens(theme);
  const ct = useCustomText(invitation.customTexts);
  // A slow bob reads as "this opens" without a label shouting it.
  const boxIdle = useIdle("bob", 0, 4.2);
  const gifts = invitation.giftRegistry;

  if (!gifts?.enabled || gifts.hideFromInvitation) return null;

  return (
    <Reveal
      as="section"
      style={{
        marginTop: t.gap.section,
        textAlign: "center",
        position: "relative",
      }}
    >
      <HouseBackdrop top="55%" width={546} />
      <SectionTitle theme={theme} textStyles={invitation.textStyles}>
        {ct("sectionTitle_giftRegistry")}
      </SectionTitle>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            marginTop: t.gap.block,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden
            src={GIFTBOX.src}
            width={GIFTBOX.w}
            height={GIFTBOX.h}
            style={{
              width: 150,
              height: "auto",
              filter: t.decorShadow,
              ...boxIdle,
            }}
          />
          <span
            style={{
              // The reference uses the OS sans for this one affordance.
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: theme.textPrimary,
            }}
          >
            {ct("mb_giftTapToOpen")}
          </span>
        </button>
      ) : (
        <div
          className="mb-gifts"
          style={{
            marginTop: t.gap.block,
            backgroundColor: t.card.bg,
            border: `1px solid ${mixWithTransparent(theme.primary, 12)}`,
            borderRadius: t.card.radius,
            padding: t.card.pad,
          }}
        >
          {/* GiftsSection returns a fragment of loose children and relies on
              its parent for the flex column, centring and card surface — drop
              it into a bare div and the pieces overlap. Its own icon chip and
              section label are hidden: the illustration above already carries
              the icon, and our SectionTitle is the heading. */}
          <style>{`
            .mb-gifts > .mb-gifts-inner > :first-child,
            .mb-gifts > .mb-gifts-inner > span:first-of-type { display: none; }
          `}</style>
          <div className="mb-gifts-inner flex flex-col items-center gap-3 text-center">
          <GiftsSection
            giftRegistry={gifts}
            theme={theme}
            ts={resolveTextStyles(theme, invitation.textStyles)}
            cardStyle={mbCardStyle(
              invitation.cardStyles,
              theme,
              "giftRegistry",
              16,
            )}
            slug={invitation.slug}
            guestToken={invitation.guest?.token}
            t={ct}
          />
          </div>
        </div>
      )}
    </Reveal>
  );
}
