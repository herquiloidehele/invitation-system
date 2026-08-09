"use client";

import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";

import type {
  CardSectionKey,
  InvitationData,
  TemplateTheme,
} from "@/lib/types";
import { resolveCardSurfaceStyle } from "@/lib/card-styles";
import { isPersonalGuestCardHiddenInPreview } from "@/lib/personal-guest-card";
import { resolveTextStyles } from "@/lib/text-styles";
import { useCustomText } from "@/lib/custom-texts";
import { shouldRenderCoupleGallery } from "@/lib/couple-gallery";
import { shouldRenderPlaces } from "@/lib/places";
import {
  getRichExternalInvitationImageSectionKeys,
  isRichExternalImageMigrationReady,
} from "@/lib/rich-external-image-sections";

import InvitationHero, { InvitationHeroNames } from "./InvitationHero";
import ImageCanvas from "./ImageCanvas";
import SectionImageHost from "./SectionImageHost";
import ExternalCountdownSection from "./ExternalCountdownSection";
import ScratchDateReveal from "@/components/curtain-canva/ScratchDateReveal";
import CanvaEmbed from "@/components/curtain-canva/CanvaEmbed";
import dynamic from "next/dynamic";
import PersonalGuestCard, {
  PREVIEW_SAMPLE_GUEST,
  PREVIEW_SAMPLE_GUEST_DISPLAY_ONLY,
} from "./PersonalGuestCard";
import { EditableCard } from "./EditableCard";
import CoupleGallery from "./gallery/CoupleGallery";
import GiftsSection from "./GiftsSection";
import FaqSection from "./FaqSection";
import PlacesSection from "./PlacesSection";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";
import { shouldShowRichExternalRsvp } from "@/lib/external-invitation-form";
import {
  shouldEnablePostScratchRsvp,
  shouldShowInlineRsvp,
} from "@/lib/scratch-rsvp";
import DynamicFontLoader from "./DynamicFontLoader";
import RSVPModal from "./RSVPModal";
import { SpacingStyleProvider } from "./SpacingStyleProvider";

// Lazy-load RSVPForm so its react-hook-form + zod dependencies only
// ship when a guest actually scrolls down to the RSVP section.
const RSVPForm = dynamic(() => import("./RSVPForm"), { ssr: false });

interface RichExternalLinkPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  isPreview?: boolean;
  /** True when shown inside the public landing-page phone preview iframe.
   *  Forces the sample personal guest card to render for display purposes. */
  isLandingPreview?: boolean;
  /** Play the hero text blocks' entrance when the rich page is revealed. */
  animateHeroText?: boolean;
  canvaPreloading?: boolean;
}

/**
 * Scrollable page used for `external_link` invitations that have at least one
 * optional rich section enabled. Mirrors CurtainCanvaPage's composition:
 *
 *   [Hero] → [ScratchDateReveal] → [iframe @ 100dvh] → [RSVP]
 *
 * Sections are independently gated:
 *  - Hero is implicit on `heroImage || videoUrl` (same rule as InvitationPage).
 *  - ScratchDateReveal renders when `scratchReveal.enabled === true`.
 *  - RSVP renders when `rsvp.enabled === true`.
 *
 * The iframe section renders only when an external link is set — the link
 * is optional, so `CanvaEmbed` renders nothing when it is empty.
 */
export default function RichExternalLinkPage({
  invitation,
  theme,
  audioRef,
  prefetchedVideoRef,
  isPreview = false,
  isLandingPreview = false,
  animateHeroText = false,
  canvaPreloading = false,
}: RichExternalLinkPageProps) {
  const heroOn = Boolean(invitation.heroImage || invitation.videoUrl);
  const countdownOn = Boolean(invitation.countdown?.enabled);
  const scratchOn = Boolean(invitation.scratchReveal?.enabled);
  const rsvpOn = Boolean(invitation.rsvp?.enabled);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const postScratchRsvpEnabled = shouldEnablePostScratchRsvp(invitation);
  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  const [canvaPageState, setCanvaPageState] = useState<{
    externalLink: string;
    isInitialPage: boolean;
  } | null>(null);
  const [measuredExternalLink, setMeasuredExternalLink] = useState<
    string | null
  >(null);
  const isInitialCanvaPage =
    canvaPageState?.externalLink === externalLink
      ? canvaPageState.isInitialPage
      : true;
  const showRsvp = shouldShowRichExternalRsvp({
    rsvpOn,
    isInitialCanvaPage,
  });
  const showInlineRsvp = shouldShowInlineRsvp({
    inlineEligible: showRsvp,
    postScratchRsvpEnabled,
  });
  const handleCanvaContentHeightReady = useCallback(
    () => setMeasuredExternalLink(externalLink),
    [externalLink],
  );
  const hostedSectionKeys = getRichExternalInvitationImageSectionKeys(
    invitation,
    { showRsvp, isLandingPreview },
  );
  const imageMigrationReady = isRichExternalImageMigrationReady({
    externalLink,
    measuredExternalLink,
  });
  const placesOn = shouldRenderPlaces(invitation);
  const ts = resolveTextStyles(theme, invitation.textStyles);
  const t = useCustomText(invitation.customTexts);
  const cs = (section: CardSectionKey, defaultRadius: number) => ({
    cardBg: invitation.cardStyles?.[section]?.cardBg || theme.cardBg,
    cardBorder:
      invitation.cardStyles?.[section]?.cardBorder || theme.cardBorder,
    borderRadius:
      invitation.cardStyles?.[section]?.borderRadius ?? defaultRadius,
    accentColor: invitation.cardStyles?.[section]?.accentColor,
    plain: invitation.cardStyles?.[section]?.plain === true,
  });

  // Defence stack:
  //   1. history.scrollRestoration = "manual" — neutralize any restored
  //      scroll position from a previous session.
  //   2. overflow-anchor: none on <html>, <body>, <main> — disable the
  //      browser's scroll-anchoring algorithm on the document scroller.
  //   3. scroll-behavior: auto on <html> — override the global smooth
  //      rule so any involuntary scroll attempt is INSTANT, not a visible
  //      multi-frame animation.
  //   4. scroll event listener — scroll events fire AFTER layout but
  //      BEFORE paint per the HTML spec's "update the rendering" steps.
  //      Resetting scrollTop here lands in the same frame's paint, so no
  //      scrolled position is ever shown to the user. This is the
  //      primary catch for the iframe-focus scroll.
  //   5. RAF pin loop, every frame for 4 s — belt-and-suspenders for the
  //      scroll-anchoring path (which per spec does NOT dispatch scroll
  //      events) and for any scroll change that for some reason did not
  //      surface as a scroll event in time.
  //   6. wheel/touchmove/keydown — real user-input signals. Once any of
  //      these fires we step aside completely so the user can scroll.
  //
  // Skipped in the admin preview, which lives in a scroll-contained pane
  // that must not be touched by document-level overrides.
  useLayoutEffect(() => {
    if (isPreview) return;
    if (typeof window === "undefined") return;

    const previous = {
      htmlOverflowAnchor: document.documentElement.style.overflowAnchor,
      bodyOverflowAnchor: document.body.style.overflowAnchor,
      htmlScrollBehavior: document.documentElement.style.scrollBehavior,
      scrollRestoration: history.scrollRestoration,
    };

    history.scrollRestoration = "manual";
    document.documentElement.style.overflowAnchor = "none";
    document.body.style.overflowAnchor = "none";
    document.documentElement.style.scrollBehavior = "auto";

    const resetScroll = () => {
      const scrollingElement = document.scrollingElement;
      if (scrollingElement) scrollingElement.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    // Track real user-input events that signal intent to scroll. We do
    // NOT use the scroll event for this: a browser-initiated involuntary
    // scroll fires a scroll event but does NOT fire wheel/touchmove/key,
    // so this stays false through anything we want to suppress.
    let userScrolled = false;
    const onUserInput = () => {
      userScrolled = true;
    };
    window.addEventListener("wheel", onUserInput, { passive: true });
    window.addEventListener("touchmove", onUserInput, { passive: true });
    window.addEventListener("keydown", onUserInput);

    const startedAt = performance.now();
    const PIN_DURATION_MS = 4000;
    const withinWindow = () => performance.now() - startedAt < PIN_DURATION_MS;

    // Primary defence — synchronous scroll handler. Fires after layout,
    // before paint; resetting scrollTop here lands in the same frame's
    // paint.
    const onScroll = () => {
      if (userScrolled) return;
      if (!withinWindow()) return;
      if (window.scrollY > 0) resetScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Belt-and-suspenders RAF loop for the scroll-anchoring path, which
    // per the CSS Scroll Anchoring spec does NOT dispatch scroll events.
    let frame = 0;
    const pinAtTop = () => {
      if (userScrolled || !withinWindow()) return;
      if (window.scrollY > 0) resetScroll();
      frame = requestAnimationFrame(pinAtTop);
    };
    frame = requestAnimationFrame(pinAtTop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onUserInput);
      window.removeEventListener("touchmove", onUserInput);
      window.removeEventListener("keydown", onUserInput);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.overflowAnchor =
        previous.htmlOverflowAnchor;
      document.body.style.overflowAnchor = previous.bodyOverflowAnchor;
      document.documentElement.style.scrollBehavior =
        previous.htmlScrollBehavior;
      history.scrollRestoration = previous.scrollRestoration;
    };
  }, [isPreview]);

  return (
    <SpacingStyleProvider spacingStyles={invitation.spacingStyles}>
      <main
        style={{
          background: theme.bg,
          color: theme.textPrimary,
          minHeight: "100dvh",
          // Belt-and-suspenders alongside the document-level overflowAnchor
          // override applied in the layout effect above — keeps this subtree
          // out of the browser's scroll-anchor candidate set even if the
          // <main> renders before the effect commits.
          overflowAnchor: "none",
        }}
      >
        <ImageCanvas
          layer={invitation.imageLayer}
          hostedSectionKeys={hostedSectionKeys}
          migrationReady={imageMigrationReady}
        >
          <DynamicFontLoader theme={theme} textStyles={invitation.textStyles} />

          {heroOn && (
            <SectionImageHost sectionKey="hero" layer={invitation.imageLayer}>
              <InvitationHero
                invitation={invitation}
                theme={theme}
                audioRef={audioRef}
                prefetchedVideoRef={prefetchedVideoRef}
                animateHeroText={animateHeroText}
              />
              {invitation.heroTextLayer?.hideDefaultText !== true && (
                <InvitationHeroNames
                  invitation={invitation}
                  theme={theme}
                  isPreview={isPreview}
                />
              )}
            </SectionImageHost>
          )}

          {scratchOn && (
            <SectionImageHost
              sectionKey="scratchReveal"
              layer={invitation.imageLayer}
            >
              <ScratchDateReveal
                date={invitation.date}
                theme={theme}
                customTexts={invitation.customTexts}
                textStyles={invitation.textStyles}
                shape={invitation.scratchReveal?.shape}
                backgroundImageUrl={
                  invitation.scratchReveal?.backgroundImageUrl
                }
                scrimOpacity={invitation.scratchReveal?.scrimOpacity}
                imageSettings={invitation.imageSettings}
                onRsvpClick={
                  postScratchRsvpEnabled ? () => setRsvpOpen(true) : undefined
                }
              />
            </SectionImageHost>
          )}

          {countdownOn && (
            <SectionImageHost
              sectionKey="countdown"
              layer={invitation.imageLayer}
            >
              <ExternalCountdownSection invitation={invitation} theme={theme} />
            </SectionImageHost>
          )}

          {(invitation.guestManagementEnabled || isLandingPreview) &&
            !isPersonalGuestCardHiddenInPreview(
              invitation,
              isLandingPreview,
            ) && (
              <SectionImageHost
                sectionKey="personalGuestCard"
                layer={invitation.imageLayer}
              >
                <div className="pb-2">
                  <EditableCard sectionKey="personalGuestCard">
                    <PersonalGuestCard
                      guest={
                        invitation.guest ??
                        (isLandingPreview
                          ? PREVIEW_SAMPLE_GUEST_DISPLAY_ONLY
                          : PREVIEW_SAMPLE_GUEST)
                      }
                      theme={theme}
                      textStyles={invitation.textStyles}
                      customTexts={invitation.customTexts}
                      cardStyle={cs("personalGuestCard", 24)}
                    />
                  </EditableCard>
                </div>
              </SectionImageHost>
            )}

          {externalLink && (
            <SectionImageHost
              sectionKey="canvaDetails"
              layer={invitation.imageLayer}
            >
              <CanvaEmbed
                externalLink={externalLink}
                theme={theme}
                title="Convite"
                onInitialPageChange={(isInitialPage) =>
                  setCanvaPageState({ externalLink, isInitialPage })
                }
                onContentHeightReady={handleCanvaContentHeightReady}
                preloading={canvaPreloading}
                guest={invitation.guest ?? null}
              />
            </SectionImageHost>
          )}

          {shouldRenderCoupleGallery(invitation) && (
            <SectionImageHost
              sectionKey="coupleGallery"
              layer={invitation.imageLayer}
            >
              <CoupleGallery
                invitation={invitation}
                theme={theme}
                isPreview={isPreview}
              />
            </SectionImageHost>
          )}

          {invitation.giftRegistry.enabled && (
            <SectionImageHost
              sectionKey="giftRegistry"
              layer={invitation.imageLayer}
            >
              <EditableCard sectionKey="giftRegistry" className="mb-10">
                <div
                  id="gifts"
                  className="flex flex-col items-center gap-3 mx-4"
                  style={{
                    ...resolveCardSurfaceStyle(cs("giftRegistry", 16), {
                      background: cs("giftRegistry", 16).cardBg,
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderRadius: cs("giftRegistry", 16).borderRadius,
                      boxShadow:
                        "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
                      border: `1px solid ${cs("giftRegistry", 16).cardBorder}`,
                    }),
                    padding: "24px 14px",
                  }}
                >
                  <GiftsSection
                    giftRegistry={invitation.giftRegistry}
                    theme={theme}
                    ts={ts}
                    cardStyle={cs("giftRegistry", 16)}
                    slug={invitation.slug}
                    guestToken={invitation.guest?.token}
                    t={t}
                  />
                </div>
              </EditableCard>
            </SectionImageHost>
          )}

          {invitation.faqs && invitation.faqs.length > 0 && (
            <SectionImageHost sectionKey="faqs" layer={invitation.imageLayer}>
              <FaqSection
                faqs={invitation.faqs}
                theme={theme}
                textStyles={invitation.textStyles}
                customTexts={invitation.customTexts}
                cardStyle={cs("faqs", 20)}
                isPreview={isPreview}
              />
            </SectionImageHost>
          )}

          {placesOn && (
            <SectionImageHost sectionKey="places" layer={invitation.imageLayer}>
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
                isPreview={isPreview}
              />
            </SectionImageHost>
          )}

          {showInlineRsvp && (
            <SectionImageHost sectionKey="rsvp" layer={invitation.imageLayer}>
              <section
                id="rsvp"
                className="relative mt-8 overflow-hidden pt-12 pb-24 md:pt-16 md:pb-28 px-6"
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
                  <div data-rsvp-card="true" className="overflow-hidden">
                    <RSVPForm
                      inline
                      invitation={invitation}
                      theme={theme}
                      customTexts={invitation.customTexts}
                      guest={invitation.guest}
                    />
                  </div>
                </div>
              </section>
            </SectionImageHost>
          )}

          {postScratchRsvpEnabled && (
            <RSVPModal
              open={rsvpOpen}
              onClose={() => setRsvpOpen(false)}
              invitation={invitation}
              theme={theme}
              customTexts={invitation.customTexts}
              guest={invitation.guest}
            />
          )}
        </ImageCanvas>
      </main>
    </SpacingStyleProvider>
  );
}
