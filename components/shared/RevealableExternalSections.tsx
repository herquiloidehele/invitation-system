"use client";

import { type RefObject, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ImageLayer, InvitationData, TemplateTheme } from "@/lib/types";
import ScratchDateReveal from "@/components/curtain-canva/ScratchDateReveal";
import CanvaEmbed from "@/components/curtain-canva/CanvaEmbed";
import ExternalCountdownSection from "@/components/shared/ExternalCountdownSection";
import PersonalGuestCard, {
  PREVIEW_SAMPLE_GUEST_DISPLAY_ONLY,
} from "@/components/shared/PersonalGuestCard";
import { EditableCard } from "@/components/shared/EditableCard";
import { EditableText } from "@/components/shared/EditableText";
import CoupleGallery from "@/components/shared/gallery/CoupleGallery";
import PlacesSection from "@/components/shared/PlacesSection";
import { SpacingStyleProvider } from "@/components/shared/SpacingStyleProvider";
import SectionImageHost from "@/components/shared/SectionImageHost";
import {
  resolveRevealContentStyle,
  resolveTextElementOverride,
  shouldRenderScratchReveal,
} from "@/lib/curtain-canva";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";
import { isPersonalGuestCardHiddenInPreview } from "@/lib/personal-guest-card";
import { shouldRenderCoupleGallery } from "@/lib/couple-gallery";
import { shouldRenderPlaces } from "@/lib/places";

// Lazy-load RSVPForm so its react-hook-form + zod dependencies only ship when
// a guest actually scrolls down to the RSVP section.
const RSVPForm = dynamic(() => import("@/components/shared/RSVPForm"), {
  ssr: false,
});

interface RevealableExternalSectionsProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** When false the whole block is visually hidden + non-interactive. */
  revealed: boolean;
  /** Background-audio element ref, owned by the parent page and started by the hero on tap. */
  audioRef: RefObject<HTMLAudioElement | null>;
  /** Free-floating images owned by semantic lower-section hosts. */
  imageLayer?: ImageLayer | null;
  /** Initial-page-only sections hide while the Canva iframe is on another page. */
  showInitialPageSections?: boolean;
  /** Mirrors CanvaEmbed's current initial-page state. */
  onCanvaInitialPageChange?: (isInitialPage: boolean) => void;
  /** Fires after the Canva iframe reports a positive measured height. */
  onCanvaContentHeightReady?: () => void;
  /** True when shown inside the public landing-page phone preview iframe.
   *  Forces the sample personal guest card to render for display purposes. */
  isLandingPreview?: boolean;
}

/**
 * The lower body shared by the curtain-canva and video-entrance layouts:
 * the hidden background-audio element (+ its visibility/unmount lifecycle),
 * and the reveal-gated scratch reveal, Canva embed, and inline RSVP. The
 * parent owns the `audioRef` (the hero plays it on tap) and the `revealed`
 * state (the hero flips it when the reveal completes).
 */
export default function RevealableExternalSections({
  invitation,
  theme,
  revealed,
  audioRef,
  imageLayer,
  showInitialPageSections = true,
  onCanvaInitialPageChange,
  onCanvaContentHeightReady,
  isLandingPreview = false,
}: RevealableExternalSectionsProps) {
  // Pause audio when the tab is hidden; resume on return.
  useEffect(() => {
    let wasPlaying = false;
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        wasPlaying = !audio.paused;
        if (wasPlaying) audio.pause();
      } else if (wasPlaying) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [audioRef]);

  // Stop audio on unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audioRef]);

  const audioEnabled =
    invitation.audio?.enabled === true && !!invitation.audio?.src;
  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  const revealContentStyle = resolveRevealContentStyle(revealed);
  const scratchRevealOn = shouldRenderScratchReveal(invitation.scratchReveal);
  const coupleGalleryOn = shouldRenderCoupleGallery(invitation);
  const placesOn = shouldRenderPlaces(invitation);

  return (
    <SpacingStyleProvider spacingStyles={invitation.spacingStyles}>
      {/* Persistent prefetched audio — no UI controls (per spec) */}
      {audioEnabled && (
        <audio
          ref={audioRef}
          src={invitation.audio.src}
          preload="auto"
          aria-hidden
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      )}

      <div style={revealContentStyle} aria-hidden={!revealed}>
        {showInitialPageSections && scratchRevealOn && (
          <SectionImageHost sectionKey="scratchReveal" layer={imageLayer}>
            <ScratchDateReveal
              date={invitation.date}
              theme={theme}
              customTexts={invitation.customTexts}
              textStyles={invitation.textStyles}
              shape={invitation.scratchReveal?.shape}
              backgroundImageUrl={invitation.scratchReveal?.backgroundImageUrl}
              scrimOpacity={invitation.scratchReveal?.scrimOpacity}
              imageSettings={invitation.imageSettings}
            />
          </SectionImageHost>
        )}

        {showInitialPageSections && invitation.countdown?.enabled && (
          <SectionImageHost sectionKey="countdown" layer={imageLayer}>
            <ExternalCountdownSection invitation={invitation} theme={theme} />
          </SectionImageHost>
        )}

        {showInitialPageSections &&
          (invitation.guest || isLandingPreview) &&
          !isPersonalGuestCardHiddenInPreview(invitation, isLandingPreview) && (
            <SectionImageHost sectionKey="personalGuestCard" layer={imageLayer}>
              <EditableCard sectionKey="personalGuestCard">
                <PersonalGuestCard
                  guest={invitation.guest ?? PREVIEW_SAMPLE_GUEST_DISPLAY_ONLY}
                  theme={theme}
                  textStyles={invitation.textStyles}
                  customTexts={invitation.customTexts}
                  backgroundImageUrl={
                    invitation.personalGuestCard?.backgroundImageUrl
                  }
                  scrimOpacity={invitation.personalGuestCard?.scrimOpacity}
                  imageSettings={invitation.imageSettings}
                  cardStyle={invitation.cardStyles?.personalGuestCard}
                  className={"pb-12 md:pb-16"}
                />
              </EditableCard>
            </SectionImageHost>
          )}

        {showInitialPageSections && coupleGalleryOn && (
          <SectionImageHost sectionKey="coupleGallery" layer={imageLayer}>
            <CoupleGallery invitation={invitation} theme={theme} />
          </SectionImageHost>
        )}

        {externalLink && (
          <SectionImageHost sectionKey="canvaDetails" layer={imageLayer}>
            <CanvaEmbed
              externalLink={externalLink}
              theme={theme}
              preloading={!revealed}
              onInitialPageChange={onCanvaInitialPageChange}
              onContentHeightReady={onCanvaContentHeightReady}
              guest={invitation.guest ?? null}
            />
          </SectionImageHost>
        )}

        {showInitialPageSections && placesOn && (
          <SectionImageHost sectionKey="places" layer={imageLayer}>
            <PlacesSection
              invitation={invitation}
              theme={theme}
              cardStyle={{
                cardBg: invitation.cardStyles?.places?.cardBg,
                cardBorder: invitation.cardStyles?.places?.cardBorder,
                borderRadius: invitation.cardStyles?.places?.borderRadius,
                accentColor: invitation.cardStyles?.places?.accentColor,
                plain: invitation.cardStyles?.places?.plain === true,
              }}
            />
          </SectionImageHost>
        )}

        {showInitialPageSections && invitation.rsvp.enabled && (
          <SectionImageHost sectionKey="rsvp" layer={imageLayer}>
            <section
              id="rsvp"
              className="relative overflow-hidden pt-12 pb-24 md:pt-16 md:pb-28 px-6"
              style={
                invitation.rsvp.backgroundImageUrl
                  ? {
                      backgroundImage: `url(${invitation.rsvp.backgroundImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="max-w-[600px] mx-auto">
                <div className="text-center mb-8">
                  <span
                    className="uppercase"
                    style={{
                      fontFamily: theme.uiFont,
                      color: theme.textSecondary,
                      fontSize: 11,
                      letterSpacing: "0.3em",
                      ...resolveTextElementOverride(
                        invitation.textStyles,
                        "inviteLabel",
                      ),
                    }}
                  >
                    <EditableText elementKey="inviteLabel">RSVP</EditableText>
                  </span>
                  <div
                    aria-hidden
                    className="mx-auto mt-3"
                    style={{
                      width: 40,
                      height: 1,
                      background: theme.accent || "#C9A961",
                      opacity: 0.7,
                    }}
                  />
                </div>
                <RSVPForm
                  inline
                  invitation={invitation}
                  theme={theme}
                  customTexts={invitation.customTexts}
                  guest={invitation.guest}
                />
              </div>
            </section>
          </SectionImageHost>
        )}
      </div>
    </SpacingStyleProvider>
  );
}
