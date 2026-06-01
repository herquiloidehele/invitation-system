"use client";

import { type MutableRefObject, type RefObject, useLayoutEffect } from "react";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { resolveTextElementOverride } from "@/lib/curtain-canva";

import InvitationHero, { InvitationHeroNames } from "./InvitationHero";
import ExternalCountdownSection from "./ExternalCountdownSection";
import ScratchDateReveal from "@/components/curtain-canva/ScratchDateReveal";
import CanvaEmbed from "@/components/curtain-canva/CanvaEmbed";
import dynamic from "next/dynamic";

// Lazy-load RSVPForm so its react-hook-form + zod dependencies only
// ship when a guest actually scrolls down to the RSVP section.
const RSVPForm = dynamic(() => import("./RSVPForm"), { ssr: false });
import PersonalGuestCard from "./PersonalGuestCard";
import { EditableText } from "./EditableText";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";
import DynamicFontLoader from "./DynamicFontLoader";

interface RichExternalLinkPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  isPreview?: boolean;
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
 * The iframe section always renders since this is, by definition, an
 * `external_link` invitation.
 */
export default function RichExternalLinkPage({
  invitation,
  theme,
  audioRef,
  prefetchedVideoRef,
  isPreview = false,
}: RichExternalLinkPageProps) {
  const heroOn = Boolean(invitation.heroImage || invitation.videoUrl);
  const countdownOn = Boolean(invitation.countdown?.enabled);
  const scratchOn = Boolean(invitation.scratchReveal?.enabled);
  const rsvpOn = Boolean(invitation.rsvp?.enabled);
  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
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
      <DynamicFontLoader theme={theme} textStyles={invitation.textStyles} />

      {heroOn && (
        <>
          <InvitationHero
            invitation={invitation}
            theme={theme}
            audioRef={audioRef}
            prefetchedVideoRef={prefetchedVideoRef}
          />
          <InvitationHeroNames
            invitation={invitation}
            theme={theme}
            isPreview={isPreview}
          />
        </>
      )}

      {invitation.guest && (
        <PersonalGuestCard guest={invitation.guest} theme={theme} />
      )}

      {scratchOn && (
        <ScratchDateReveal
          date={invitation.date}
          theme={theme}
          customTexts={invitation.customTexts}
          textStyles={invitation.textStyles}
        />
      )}

      {countdownOn && (
        <ExternalCountdownSection invitation={invitation} theme={theme} />
      )}

      <CanvaEmbed
        externalLink={externalLink}
        theme={theme}
        title="Convite"
        preloading={false}
      />

      {rsvpOn && (
        <>
          <SectionOrnament theme={theme} />
          <section
            id="rsvp"
            className="pt-12 pb-24 md:pt-16 md:pb-28 max-w-[600px] mx-auto px-6"
          >
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
          </section>
        </>
      )}
    </main>
  );
}

/**
 * Subtle decorative break between page sections — a thin gold rule with a
 * small diamond glyph at the center. Mirrors the local SectionOrnament in
 * CurtainCanvaPage to keep the two pages visually consistent without coupling
 * them.
 */
function SectionOrnament({ theme }: { theme: TemplateTheme }) {
  const accent = theme.accent || "#C9A961";
  return (
    <div
      aria-hidden
      className="flex items-center justify-center gap-3 my-2"
      style={{ color: accent }}
    >
      <span
        style={{ height: 1, width: 60, background: accent, opacity: 0.55 }}
      />
      <span
        style={{
          width: 6,
          height: 6,
          background: accent,
          transform: "rotate(45deg)",
          opacity: 0.85,
        }}
      />
      <span
        style={{ height: 1, width: 60, background: accent, opacity: 0.55 }}
      />
    </div>
  );
}
