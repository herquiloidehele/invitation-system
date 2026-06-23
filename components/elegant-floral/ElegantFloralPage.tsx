"use client";

import dynamic from "next/dynamic";
import type { MutableRefObject, RefObject } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import InvitationHero from "@/components/shared/InvitationHero";
import DynamicFontLoader from "@/components/shared/DynamicFontLoader";
import Announcement from "./Announcement";
import Countdown from "./Countdown";
import LocationCard from "./LocationCard";
import FloralDivider from "./FloralDivider";
import ScheduleBlock from "./ScheduleBlock";
import CoupleGallery from "@/components/shared/gallery/CoupleGallery";
import DressCodeSection from "./DressCodeSection";
import GiftsSection from "./GiftsSection";
import FaqSection from "./FaqSection";
import ScriptTitle from "./ScriptTitle";
import { Reveal, EfRevealProvider } from "./motion";
import { efStyle } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";

// The inline RSVP form pulls in react-hook-form + zod; lazy-load it (below the
// fold) so it doesn't bloat the initial page bundle.
const RSVPForm = dynamic(() => import("@/components/shared/RSVPForm"), {
  ssr: false,
});

export interface ElegantFloralPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  isLandingPreview?: boolean;
  /** Admin/live preview — reveal all sections immediately instead of on scroll. */
  isPreview?: boolean;
  animateHeroText?: boolean;
}

/**
 * Bespoke page for the "elegant-floral" layout. Reuses the envelope shell
 * (rendered by EnvelopeInvitationView) and the shared InvitationHero + RSVP
 * form, with custom sections matching the Canva reference. Sections reveal on
 * scroll via the helpers in ./motion.
 */
export default function ElegantFloralPage({
  invitation,
  theme,
  audioRef,
  prefetchedVideoRef,
  isPreview,
  animateHeroText,
}: ElegantFloralPageProps) {
  const ts = invitation.textStyles;
  return (
    <EfRevealProvider instant={isPreview ?? false}>
      <div style={{ backgroundColor: theme.bg, color: theme.textPrimary }}>
      <DynamicFontLoader theme={theme} textStyles={invitation.textStyles} />

      <InvitationHero
        invitation={invitation}
        theme={theme}
        audioRef={audioRef}
        prefetchedVideoRef={prefetchedVideoRef}
        animateHeroText={animateHeroText}
      />

      {invitation.quote && (
        <Reveal>
          <p
            style={efStyle(
              {
                margin: 0,
                textAlign: "center",
                padding: "1.4rem clamp(1.25rem, 6vw, 2.75rem) 0",
                fontFamily: theme.bodyFont,
                fontStyle: "italic",
                color: theme.textSecondary,
                fontSize: "clamp(1.02rem, 4vw, 1.28rem)",
                lineHeight: 1.5,
              },
              ts,
              "efBlessing",
            )}
          >
            <EditableText elementKey="efBlessing">{invitation.quote}</EditableText>
          </p>
        </Reveal>
      )}

      <Announcement invitation={invitation} theme={theme} />

      <CoupleGallery
        invitation={invitation}
        theme={theme}
        isPreview={isPreview}
      />

      <Countdown invitation={invitation} theme={theme} />

      <LocationCard
        label="Cerimónia Religiosa"
        location={invitation.location}
        theme={theme}
        textStyles={ts}
      />

      {invitation.location2 && (
        <LocationCard
          label="Recepção"
          location={invitation.location2}
          theme={theme}
          textStyles={ts}
        />
      )}

      <Reveal>
        <FloralDivider
          primary={theme.primary}
          secondary={theme.secondary}
          style={{ marginTop: "1.5rem" }}
        />
      </Reveal>

      <ScheduleBlock invitation={invitation} theme={theme} />

      <DressCodeSection
        dressCode={invitation.dressCode}
        theme={theme}
        textStyles={ts}
      />

      <GiftsSection
        giftRegistry={invitation.giftRegistry}
        theme={theme}
        textStyles={ts}
      />

      {invitation.faqs && (
        <FaqSection faqs={invitation.faqs} theme={theme} textStyles={ts} />
      )}

      {/* RSVP — inline form (Canva style). The shared form renders its own
          header, which we hide so our gold-script title is the single heading. */}
      <section
        style={{
          padding: "2rem clamp(1rem, 4.5vw, 1.75rem) 3.5rem",
          maxWidth: 560,
          marginInline: "auto",
        }}
      >
        <Reveal style={{ textAlign: "center" }}>
          <ScriptTitle theme={theme} textStyles={ts}>
            Confirmar Presença
          </ScriptTitle>
        </Reveal>

        <Reveal delay={0.04}>
          <FloralDivider
            primary={theme.primary}
            secondary={theme.secondary}
            width={170}
            style={{ marginTop: "0.6rem" }}
          />
        </Reveal>

        {invitation.rsvp?.enabled && (
          <Reveal delay={0.05}>
            <div className="ef-rsvp" style={{ marginTop: "1.5rem" }}>
              <style>{`
                .ef-rsvp > div:first-of-type{display:none}
                .ef-rsvp ::placeholder{color:${theme.textMuted};opacity:.75}
                .ef-rsvp input:focus,.ef-rsvp textarea:focus{--tw-ring-color:${theme.secondary}55;border-color:${theme.primary} !important}
              `}</style>
              <RSVPForm
                inline
                invitation={invitation}
                theme={theme}
                customTexts={invitation.customTexts}
                guest={invitation.guest}
                paletteOverride={{
                  fieldBg: `color-mix(in srgb, ${theme.secondary} 9%, #ffffff)`,
                  border: `color-mix(in srgb, ${theme.secondary} 48%, transparent)`,
                  text: theme.textPrimary,
                  textSoft: theme.secondary,
                  textMuted: theme.textMuted,
                  accent: theme.primary,
                }}
              />
            </div>
          </Reveal>
        )}
      </section>
      </div>
    </EfRevealProvider>
  );
}
