"use client";

import { useState, type MutableRefObject, type RefObject } from "react";
import dynamic from "next/dynamic";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import type { Wish } from "@/lib/minimalism-brown";
import { mbStyle, mbTokens } from "@/lib/minimalism-brown";
import DynamicFontLoader from "@/components/shared/DynamicFontLoader";
import ImageCanvas from "@/components/shared/ImageCanvas";
import { SpacingStyleProvider } from "@/components/shared/SpacingStyleProvider";
import { EditableText } from "@/components/shared/EditableText";
import { PaperGround, LeafWatermark, Sprig } from "./Decor";
import {
  MbKeyframes,
  MbMotionProvider,
  Reveal,
  useAutoScroll,
} from "./motion";
import Hero from "./Hero";
import CeremonyInfo from "./CeremonyInfo";
import PhotoGallery from "./PhotoGallery";
import ReceptionInfo from "./ReceptionInfo";
import VenueCard from "./VenueCard";
import DressCode from "./DressCode";
import Schedule from "./Schedule";
import Guestbook from "./Guestbook";
import GiftBox from "./GiftBox";
import OptionalSections from "./OptionalSections";

// The RSVP modal drags in react-hook-form + zod; keep it off the first load.
const RSVPModal = dynamic(() => import("@/components/shared/RSVPModal"), {
  ssr: false,
});

export interface MinimalismBrownPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  isLandingPreview?: boolean;
  /** Admin/live preview — reveal all sections immediately instead of on scroll. */
  isPreview?: boolean;
  animateHeroText?: boolean;
  /** Public wishes, resolved server-side. Absent when the guestbook is off. */
  wishes?: Wish[];
}

/**
 * Bespoke page for the "minimalism-brown" layout.
 *
 * Reuses the envelope shell (rendered by InvitationView) and the platform's
 * shared sections, with a warm earthy design language defined once in
 * mbTokens. No section hard-codes a color, font or spacing value — everything
 * derives from the theme, so the template stays customizable from the admin.
 */
export default function MinimalismBrownPage(props: MinimalismBrownPageProps) {
  // The provider has to wrap the body so useAutoScroll and every idle loop can
  // read the reduced-motion and preview flags from context.
  return (
    <MbMotionProvider instant={props.isPreview ?? false}>
      <MinimalismBrownBody {...props} />
    </MbMotionProvider>
  );
}

function MinimalismBrownBody({
  invitation,
  theme,
  isPreview,
  wishes,
}: MinimalismBrownPageProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const openRsvp = () => setRsvpOpen(true);

  // Carry the reader down the page when the invitation opens, until they take
  // over. Never in the admin preview, where an editor is trying to work.
  useAutoScroll({ enabled: !isPreview && !rsvpOpen });

  return (
    <SpacingStyleProvider spacingStyles={invitation.spacingStyles}>
      <div
        style={{
          position: "relative",
          backgroundColor: theme.bg,
          color: theme.textPrimary,
          overflow: "hidden",
        }}
      >
        <MbKeyframes />
        <PaperGround />
        <LeafWatermark side="left" top={420} index={0} depth={0.1} />
        <LeafWatermark
          side="right"
          top={1600}
          opacity={0.14}
          index={1}
          depth={0.16}
        />
        <LeafWatermark
          side="left"
          top={3000}
          opacity={0.12}
          index={2}
          depth={0.07}
        />

        <ImageCanvas layer={invitation.imageLayer}>
          <DynamicFontLoader theme={theme} textStyles={ts} />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: t.column,
              marginInline: "auto",
              // No horizontal padding here: the reference's column is flush and
              // each section owns its own inset. Padding both levels made every
              // section narrower than the original.
              padding: `0 0 ${t.gap.section}px`,
            }}
          >
            <Hero invitation={invitation} theme={theme} />
            <CeremonyInfo invitation={invitation} theme={theme} />
            <PhotoGallery invitation={invitation} theme={theme} />
            <ReceptionInfo
              invitation={invitation}
              theme={theme}
              onRsvpClick={openRsvp}
            />
            <div style={{ paddingInline: t.gutter }}>
              <VenueCard invitation={invitation} theme={theme} />
            </div>
            <div style={{ paddingInline: t.gutter }}>
              <DressCode invitation={invitation} theme={theme} />
            </div>
            <Schedule invitation={invitation} theme={theme} />
            <div style={{ paddingInline: t.gutter }}>
              <Guestbook
                invitation={invitation}
                theme={theme}
                wishes={wishes}
                onRsvpClick={openRsvp}
              />
            </div>
            <div style={{ paddingInline: t.gutter }}>
              <GiftBox invitation={invitation} theme={theme} />
            </div>
            <div style={{ paddingInline: t.gutter }}>
              <OptionalSections
                invitation={invitation}
                theme={theme}
                onRsvpClick={openRsvp}
              />
            </div>

            {invitation.quote && (
              <Reveal
                as="footer"
                style={{
                  marginTop: t.gap.section,
                  textAlign: "center",
                  paddingInline: t.gutter,
                }}
              >
                <Sprig
                  theme={theme}
                  width={90}
                  index={2}
                  style={{ marginInline: "auto" }}
                />
                <p
                  style={mbStyle(
                    {
                      margin: `${t.gap.row}px 0 0`,
                      fontFamily: t.title.font,
                      fontSize: 12,
                      fontWeight: 300,
                      lineHeight: 1.8,
                      color: theme.textPrimary,
                    },
                    ts,
                    "mbFooter",
                  )}
                >
                  <EditableText elementKey="mbFooter">
                    {invitation.quote}
                  </EditableText>
                </p>
              </Reveal>
            )}
          </div>
        </ImageCanvas>

        {invitation.rsvp?.enabled && (
          <RSVPModal
            open={rsvpOpen}
            onClose={() => setRsvpOpen(false)}
            invitation={invitation}
            theme={theme}
            customTexts={invitation.customTexts}
            guest={invitation.guest}
          />
        )}
      </div>
    </SpacingStyleProvider>
  );
}
