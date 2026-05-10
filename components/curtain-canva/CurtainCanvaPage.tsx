"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import CurtainsHero from "./CurtainsHero";
import ScratchDateReveal from "./ScratchDateReveal";
import CanvaEmbed from "./CanvaEmbed";
import RSVPForm from "@/components/shared/RSVPForm";
import { resolveRevealContentStyle } from "@/lib/curtain-canva";

interface CurtainCanvaPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function CurtainCanvaPage({
  invitation,
  theme,
}: CurtainCanvaPageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { trackEvent } = useAnalytics(invitation.slug);

  // Curtain-reveal gating: while the user hasn't tapped the curtain yet
  // (or the video hasn't finished playing), the page is locked to the
  // hero viewport — no scroll, no peek at the sections below.
  const [revealed, setRevealed] = useState(false);
  const scrollLockRef = useRef<{
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    bodyWidth: string;
    htmlOverflow: string;
    htmlOverflowAnchor: string;
    bodyOverflowAnchor: string;
    scrollRestoration: History["scrollRestoration"];
  } | null>(null);
  const handleRevealed = useCallback(() => setRevealed(true), []);

  // Track page_view on mount, mirroring InvitationView's behavior so
  // analytics dashboards show curtain-canva opens too.
  useEffect(() => {
    trackEvent("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause audio when the tab is hidden; resume on return — mirrors InvitationView.
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
  }, []);

  // Stop audio on unmount. Capture the ref into a local variable so the
  // cleanup function uses the same audio element it observed at effect time
  // (per react-hooks/exhaustive-deps guidance).
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  // Lock document scroll until the curtains open. The fixed-body lock keeps
  // the hero visually pinned even if the browser restores an old lower-page
  // scroll offset before hydration.
  useLayoutEffect(() => {
    scrollLockRef.current = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
      htmlOverflowAnchor: document.documentElement.style.overflowAnchor,
      bodyOverflowAnchor: document.body.style.overflowAnchor,
      scrollRestoration: history.scrollRestoration,
    };

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.body.style.position = "fixed";
    document.body.style.top = "0";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflowAnchor = "none";
    document.documentElement.style.overflowAnchor = "none";

    return () => {
      const previous = scrollLockRef.current;
      if (!previous) return;
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.position = previous.bodyPosition;
      document.body.style.top = previous.bodyTop;
      document.body.style.left = previous.bodyLeft;
      document.body.style.right = previous.bodyRight;
      document.body.style.width = previous.bodyWidth;
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.body.style.overflowAnchor = previous.bodyOverflowAnchor;
      document.documentElement.style.overflowAnchor =
        previous.htmlOverflowAnchor;
      history.scrollRestoration = previous.scrollRestoration;
      scrollLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!revealed) return;

    let frame = 0;
    const resetScroll = () => {
      const scrollingElement = document.scrollingElement;
      if (scrollingElement) scrollingElement.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    frame = requestAnimationFrame(() => {
      const previous = scrollLockRef.current;
      resetScroll();

      if (previous) {
        document.body.style.overflow = previous.bodyOverflow;
        document.body.style.position = previous.bodyPosition;
        document.body.style.top = previous.bodyTop;
        document.body.style.left = previous.bodyLeft;
        document.body.style.right = previous.bodyRight;
        document.body.style.width = previous.bodyWidth;
        document.documentElement.style.overflow = previous.htmlOverflow;
        document.body.style.overflowAnchor = previous.bodyOverflowAnchor;
        document.documentElement.style.overflowAnchor =
          previous.htmlOverflowAnchor;
        history.scrollRestoration = previous.scrollRestoration;
        scrollLockRef.current = null;
      }

      // Phase 1: pin to top every frame for a short window so any sync layout
      // shifts on reveal cannot scroll-anchor the viewport.
      const startedAt = performance.now();
      const PIN_DURATION_MS = 250;
      const pinAtTop = () => {
        resetScroll();
        if (performance.now() - startedAt < PIN_DURATION_MS) {
          frame = requestAnimationFrame(pinAtTop);
        }
      };
      pinAtTop();
    });

    // Phase 2: while the iframe finishes measuring, the document height keeps
    // growing for up to a few seconds. Whenever scrollHeight changes within
    // this window, snap back to the top so the user is not yanked down to the
    // newly-tall iframe section. We only intervene if the user has not yet
    // scrolled deliberately.
    let lastScrollHeight = document.documentElement.scrollHeight;
    let userScrolled = false;
    const onUserScroll = () => {
      if (window.scrollY > 4) userScrolled = true;
    };
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("keydown", onUserScroll);

    const heightWatcherStart = performance.now();
    const HEIGHT_WATCHER_MS = 4000;
    const heightWatcher = window.setInterval(() => {
      if (performance.now() - heightWatcherStart > HEIGHT_WATCHER_MS) {
        window.clearInterval(heightWatcher);
        return;
      }
      const next = document.documentElement.scrollHeight;
      if (next !== lastScrollHeight) {
        lastScrollHeight = next;
        if (!userScrolled) resetScroll();
      }
    }, 80);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(heightWatcher);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("keydown", onUserScroll);
    };
  }, [revealed]);

  const handleTapped = () => {
    trackEvent("envelope_open"); // semantic name retained from existing taxonomy
  };

  const audioEnabled =
    invitation.audio?.enabled === true && !!invitation.audio?.src;
  const revealContentStyle = resolveRevealContentStyle(revealed);

  return (
    <main
      className="min-h-dvh overflow-x-hidden"
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        overflowAnchor: "none",
      }}
    >
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

      <CurtainsHero
        couple={invitation.couple}
        quote={invitation.quote}
        theme={theme}
        audioRef={audioRef}
        videoUrl={invitation.videoUrl}
        videoPoster={invitation.videoPoster}
        customTexts={invitation.customTexts}
        onTapped={handleTapped}
        onRevealed={handleRevealed}
      />

      <div style={revealContentStyle} aria-hidden={!revealed}>
        <ScratchDateReveal
          date={invitation.date}
          theme={theme}
          customTexts={invitation.customTexts}
        />

        {invitation.externalLink && (
          <CanvaEmbed externalLink={invitation.externalLink} theme={theme} />
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
                  }}
                >
                  RSVP
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
    </main>
  );
}

/**
 * Subtle decorative break between page sections — a thin gold rule with
 * a small diamond glyph at the center. Used to give the long single-page
 * layout a gentle visual cadence without hard dividers.
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
        style={{
          height: 1,
          width: 60,
          background: accent,
          opacity: 0.55,
        }}
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
        style={{
          height: 1,
          width: 60,
          background: accent,
          opacity: 0.55,
        }}
      />
    </div>
  );
}
