"use client";

import { type RefObject, useEffect } from "react";
import dynamic from "next/dynamic";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import ScratchDateReveal from "@/components/curtain-canva/ScratchDateReveal";
import CanvaEmbed from "@/components/curtain-canva/CanvaEmbed";
import { EditableText } from "@/components/shared/EditableText";
import {
  resolveRevealContentStyle,
  resolveTextElementOverride,
  shouldRenderScratchReveal,
} from "@/lib/curtain-canva";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";

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

  return (
    <>
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
        {scratchRevealOn && (
          <ScratchDateReveal
            date={invitation.date}
            theme={theme}
            customTexts={invitation.customTexts}
            textStyles={invitation.textStyles}
          />
        )}

        {externalLink && (
          <CanvaEmbed
            externalLink={externalLink}
            theme={theme}
            preloading={!revealed}
          />
        )}

        {invitation.rsvp.enabled && (
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
      </div>
    </>
  );
}

/**
 * Subtle decorative break between page sections — a thin gold rule with a
 * small diamond glyph at the center.
 */
function SectionOrnament({ theme }: { theme: TemplateTheme }) {
  const accent = theme.accent || "#C9A961";
  return (
    <div
      aria-hidden
      className="flex items-center justify-center gap-3 my-2"
      style={{ color: accent }}
    >
      <span style={{ height: 1, width: 60, background: accent, opacity: 0.55 }} />
      <span
        style={{
          width: 6,
          height: 6,
          background: accent,
          transform: "rotate(45deg)",
          opacity: 0.85,
        }}
      />
      <span style={{ height: 1, width: 60, background: accent, opacity: 0.55 }} />
    </div>
  );
}
