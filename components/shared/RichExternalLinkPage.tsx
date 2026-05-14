"use client";

import { type MutableRefObject, type RefObject, useEffect } from "react";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { resolveTextElementOverride } from "@/lib/curtain-canva";

import InvitationHero, { InvitationHeroNames } from "./InvitationHero";
import ScratchDateReveal from "@/components/curtain-canva/ScratchDateReveal";
import CanvaEmbed from "@/components/curtain-canva/CanvaEmbed";
import RSVPForm from "./RSVPForm";
import { EditableText } from "./EditableText";

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
  const scratchOn = Boolean(invitation.scratchReveal?.enabled);
  const rsvpOn = Boolean(invitation.rsvp?.enabled);
  const externalLink = invitation.externalLink ?? "";

  // The envelope cover flips this component into the DOM only after the
  // user opens the invite. Pin the viewport to the top so the user lands
  // on the hero, not somewhere inside the iframe. (Without this, browser
  // scroll-anchoring on the loading iframe can yank the page down as it
  // grows.) Skipped in the admin preview, which lives in a scroll-
  // contained pane.
  useEffect(() => {
    if (isPreview) return;
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [isPreview]);

  return (
    <main
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        minHeight: "100dvh",
      }}
    >
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

      {scratchOn && (
        <ScratchDateReveal
          date={invitation.date}
          theme={theme}
          customTexts={invitation.customTexts}
          textStyles={invitation.textStyles}
        />
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
