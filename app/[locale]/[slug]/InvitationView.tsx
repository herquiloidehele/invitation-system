"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import type { ExternalVideoPageHandle } from "@/components/shared/ExternalVideoPage";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import VideoSequenceCover from "@/components/shared/VideoSequenceCover";
import { isCurtainCanvaLayout } from "@/lib/curtain-canva";
import { isVideoEntranceLayout } from "@/lib/video-entrance";
import { shouldRenderVideoSequenceCover } from "@/lib/cover-videos";
import { isElegantFloralLayout } from "@/lib/elegant-floral";
import { hasRichExternalSections, shouldPreloadRichExternalCanva } from "@/lib/external-invitation-form";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";
import { shouldUseBackgroundAudio } from "@/lib/invitation-audio";
import { fireCelebrationConfetti, resolveEnvelopeConfettiColors } from "@/lib/confetti";

// Each invitation type renders exactly one of these pages. Splitting them
// behind dynamic imports keeps the per-guest bundle to just the path
// they actually see (e.g. a standard invitation no longer ships the
// Canva embed or scratch-coin canvas code). `ssr: false` is safe — the
// branching is purely client-state. `EnvelopeCover` stays static because
// it's the only thing rendered before the user taps; lazy-loading it
// would block first paint.
const InvitationPage = dynamic(
  () => import("@/components/shared/InvitationPage"),
  { ssr: false },
);
const ExternalVideoPage = dynamic(
  () => import("@/components/shared/ExternalVideoPage"),
  { ssr: false },
);
const ExternalLinkPage = dynamic(
  () => import("@/components/shared/ExternalLinkPage"),
  { ssr: false },
);
const RichExternalLinkPage = dynamic(
  () => import("@/components/shared/RichExternalLinkPage"),
  { ssr: false },
);
const CurtainCanvaPage = dynamic(
  () => import("@/components/curtain-canva/CurtainCanvaPage"),
  { ssr: false },
);
const VideoEntrancePage = dynamic(
  () => import("@/components/video-entrance/VideoEntrancePage"),
  { ssr: false },
);
const ElegantFloralPage = dynamic(
  () => import("@/components/elegant-floral/ElegantFloralPage"),
  { ssr: false },
);

interface InvitationViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** True when rendered inside the public landing-page phone preview iframe.
   *  Forces the sample personal guest card to show for display purposes. */
  isLandingPreview?: boolean;
  /** Allows landing showcase iframes to lazy-load nested external-link iframes. */
  lazyExternalIframe?: boolean;
  /** Section id to reveal + scroll to on load (e.g. "gifts" when returning from
   *  the gifts sub-page). When set, the envelope cover is skipped. */
  initialSection?: string;
}

export default function InvitationView({
  invitation,
  theme,
  isLandingPreview = false,
  lazyExternalIframe = false,
  initialSection,
}: InvitationViewProps) {
  // Curtain-Canva templates skip the entire envelope flow and render
  // their own self-contained page. Branch at the top so the
  // envelope-specific hook tree is never instantiated for these themes.
  if (isVideoEntranceLayout(theme)) {
    return <VideoEntrancePage invitation={invitation} theme={theme} />;
  }
  if (isCurtainCanvaLayout(theme)) {
    return (
      <CurtainCanvaPage
        invitation={invitation}
        theme={theme}
        isLandingPreview={isLandingPreview}
      />
    );
  }
  return (
    <EnvelopeInvitationView
      invitation={invitation}
      theme={theme}
      isLandingPreview={isLandingPreview}
      lazyExternalIframe={lazyExternalIframe}
      initialSection={initialSection}
    />
  );
}

function EnvelopeInvitationView({
  invitation,
  theme,
  isLandingPreview = false,
  lazyExternalIframe = false,
  initialSection,
}: InvitationViewProps) {
  // When arriving back from a sub-page (e.g. the gifts list) via `?section=`,
  // skip the envelope cover and reveal the content directly so we can scroll to
  // that section. Only applies to the standard scrollable invitation flow.
  const skipToSection =
    initialSection && (invitation.invitationType ?? "standard") === "standard"
      ? initialSection
      : null;
  const [coverVisible, setCoverVisible] = useState(!skipToSection);
  // Flips to true if the video-sequence cover's first clip fails to load before
  // playback — we then render the standard envelope instead.
  const [videoCoverFailed, setVideoCoverFailed] = useState(false);
  const [showContent, setShowContent] = useState(Boolean(skipToSection));
  const [videoVisible, setVideoVisible] = useState(false);
  const [externalLinkVisible, setExternalLinkVisible] = useState(false);
  const [richExternalLinkVisible, setRichExternalLinkVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioStartedRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<ExternalVideoPageHandle | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const isExternalVideo =
    (invitation.invitationType ?? "standard") === "external_video";

  const isRichExternalLink =
    (invitation.invitationType ?? "standard") === "external_link" &&
    hasRichExternalSections(invitation);

  const effectiveExternalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });

  // Bare-iframe external_link path — only when the rich layout is NOT used.
  const isExternalLink =
    (invitation.invitationType ?? "standard") === "external_link" &&
    !!effectiveExternalLink &&
    !isRichExternalLink;

  // Standard invitations with a hero video need the bytes pre-buffered
  // before the invite is opened, so the video plays instantly.
  // Rich external_link invitations may also have a hero video for their
  // InvitationHero section — share the same prefetch slot.
  const isStandardWithVideo =
    ((invitation.invitationType ?? "standard") === "standard" ||
      isRichExternalLink) &&
    !!invitation.videoUrl;

  // Likewise, pre-buffer the background audio so it plays immediately
  // when the user taps the envelope instead of waiting for a download.
  const hasBackgroundAudio = shouldUseBackgroundAudio(
    invitation.invitationType,
    invitation.audio,
  );

  // The video-sequence cover replaces the envelope for every invitation type
  // (standard, external_video, external_link — bare or rich). Each type's
  // existing handoff runs when the last clip ends: standard/rich fade in their
  // content, bare external_link reveals its preloaded iframe, and external_video
  // plays imperatively (keeping its own muted-autoplay fallback if iOS blocks
  // sound after the longer cover).
  const usesVideoCover =
    shouldRenderVideoSequenceCover(invitation.coverVideos) && !videoCoverFailed;

  // Merge per-invitation envelope overrides on top of the theme defaults
  const mergedTheme = useMemo<TemplateTheme>(() => {
    const overrides = invitation.envelope;
    if (!overrides) return theme;
    return {
      ...theme,
      envelope: {
        base: overrides.base || theme.envelope.base,
        topFlap: overrides.topFlap || theme.envelope.topFlap,
        bottomFlap: overrides.bottomFlap || theme.envelope.bottomFlap,
      },
    };
  }, [theme, invitation.envelope]);

  /** Upgrade the hero prefetch video's preload hint once the user commits. */
  const upgradeHeroPreload = useCallback(() => {
    // Do NOT call `.load()` here: that runs the media element load algorithm,
    // which aborts the in-flight fetch and re-downloads the resource from
    // scratch, throwing away everything preload="metadata" already pulled.
    const heroVideo = heroVideoRef.current;
    if (heroVideo) {
      heroVideo.preload = "auto";
    }
  }, []);

  /** Start the pre-buffered background music with a cinematic volume fade-in. */
  const startBackgroundAudio = useCallback(() => {
    if (!hasBackgroundAudio) return;
    if (bgAudioStartedRef.current) return; // start once (on playback-start or handoff)
    bgAudioStartedRef.current = true;
    // Use the pre-buffered <audio> element so playback starts instantly.
    // play() continues the download from the buffered metadata and starts
    // as soon as it has enough — no `.load()` reset needed.
    try {
      const audio = audioRef.current;
      if (!audio) return;
      audio.preload = "auto";
      audio.loop = true;
      audio.muted = false; // unmute if it was primed muted on the video-cover tap
      audio.volume = 0.03;
      audio
        .play()
        .then(() => {
          // Cinematic volume fade-in synced with the slow-motion opening
          let vol = 0.03;
          const fade = setInterval(() => {
            vol = Math.min(vol + 0.02, 0.5);
            audio.volume = vol;
            if (vol >= 0.5) clearInterval(fade);
          }, 200); // ~5s to reach full volume
          fadeIntervalRef.current = fade;
        })
        .catch(() => {});
    } catch {
      /* silent */
    }
  }, [hasBackgroundAudio]);

  /** Cover tap (envelope or video sequence): warm the hero prefetch and start
   *  the background music immediately, within the user gesture. */
  const handleOpen = useCallback(() => {
    upgradeHeroPreload();
    startBackgroundAudio();
  }, [upgradeHeroPreload, startBackgroundAudio]);

  /** Video-sequence cover tap: warm the hero prefetch and PRIME the background
   *  music muted inside the gesture. It's unmuted only once the video actually
   *  starts playing (onPlaybackStart) or at handoff — so it's never audible
   *  while the video is still buffering or failing to render (e.g. an
   *  unsupported codec), which would otherwise be "audio with no video". */
  const handleVideoCoverOpen = useCallback(() => {
    upgradeHeroPreload();
    if (hasBackgroundAudio) {
      const audio = audioRef.current;
      if (audio) {
        audio.loop = true;
        audio.muted = true;
        audio.volume = 0;
        audio.play().catch(() => {});
      }
    }
  }, [upgradeHeroPreload, hasBackgroundAudio]);

  /** Pause audio when the tab is hidden / browser is minimized; resume on return. */
  useEffect(() => {
    let wasPlayingBeforeHide = false;

    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        wasPlayingBeforeHide = !audio.paused;
        if (wasPlayingBeforeHide) audio.pause();
      } else {
        if (wasPlayingBeforeHide) audio.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /** Stop music and clean up when leaving the invitation page. */
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Returning from a sub-page with `?section=`: scroll to that section once it
   * exists (the elegant-floral page is a dynamic `ssr:false` import, so poll
   * briefly), re-scroll a couple of times as images above settle, then strip
   * the param so the URL stays clean (and a refresh re-shows the envelope).
   */
  useEffect(() => {
    if (!skipToSection) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scrollToEl = () => {
      const el = document.getElementById(skipToSection);
      if (el) el.scrollIntoView({ block: "start" });
      return Boolean(el);
    };
    let waited = 0;
    const settle = () => {
      if (cancelled) return;
      if (scrollToEl()) {
        timers.push(setTimeout(scrollToEl, 250));
        timers.push(setTimeout(scrollToEl, 700));
      } else if (waited < 3000) {
        waited += 60;
        timers.push(setTimeout(settle, 60));
      }
    };
    settle();
    const url = new URL(window.location.href);
    if (url.searchParams.has("section")) {
      url.searchParams.delete("section");
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [skipToSection]);

  /**
   * The envelope's internal animation sequence is done.
   * Show the invitation content instantly — the envelope's scene-fade
   * has already cross-dissolved to the bg color, so the transition
   * is seamless.
   */
  const handleAnimationComplete = useCallback(() => {
    // Ensure the background music is playing by the time the cover hands off.
    // Covers the video-sequence case where the clips never actually started
    // (unsupported codec / stall): it unmutes the primed track now. Idempotent —
    // a no-op if it already started with playback or on the envelope tap.
    startBackgroundAudio();

    // Celebratory confetti the moment the envelope finishes opening.
    // Opt-in per invitation (default off); colors fall back to the theme.
    const confettiColors = resolveEnvelopeConfettiColors(
      invitation.envelope,
      theme,
    );
    if (confettiColors) {
      fireCelebrationConfetti(confettiColors);
    }

    const type = invitation.invitationType ?? "standard";

    // For external video: play imperatively (within the gesture context) and
    // reveal the video. The <video> element is already mounted and preloading.
    if (type === "external_video") {
      videoRef.current?.play();
      setVideoVisible(true);
      requestAnimationFrame(() => setCoverVisible(false));
      return;
    }

    // For external links, the behavior depends on whether the rich layout
    // is enabled:
    //  - Rich layout: behave like a standard invitation — fade in the full
    //    scrollable page (hero → scratch → iframe → RSVP) after the envelope.
    //  - Bare layout: the <iframe> has been pre-loading behind the envelope
    //    cover; just reveal it — no extra fetch needed.
    if (type === "external_link") {
      if (isRichExternalLink) {
        setRichExternalLinkVisible(true);
        requestAnimationFrame(() => setCoverVisible(false));
        return;
      }
      setExternalLinkVisible(true);
      requestAnimationFrame(() => setCoverVisible(false));
      return;
    }

    setShowContent(true);
    requestAnimationFrame(() => {
      setCoverVisible(false);
    });
  }, [
    invitation.invitationType,
    invitation.envelope,
    theme,
    isRichExternalLink,
    startBackgroundAudio,
  ]);

  /** Render the appropriate content based on invitation type. */
  function renderContent() {
    // External link/video are rendered as persistent siblings (outside this
    // AnimatePresence) so they can prefetch behind the envelope cover.
    // Elegant-floral keeps the envelope shell but swaps the post-envelope page.
    if (isElegantFloralLayout(theme)) {
      return (
        <ElegantFloralPage
          invitation={invitation}
          theme={theme}
          audioRef={audioRef}
          prefetchedVideoRef={isStandardWithVideo ? heroVideoRef : undefined}
          isLandingPreview={isLandingPreview}
          animateHeroText
        />
      );
    }
    // Default: standard full invitation page.
    return (
      <InvitationPage
        invitation={invitation}
        theme={theme}
        audioRef={audioRef}
        prefetchedVideoRef={isStandardWithVideo ? heroVideoRef : undefined}
        isLandingPreview={isLandingPreview}
        animateHeroText
      />
    );
  }

  return (
    /* Outer full-screen layer — visible on wide screens as the side gutters */
    <div
      className="min-h-dvh flex justify-center"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Inner column — capped at 500 px, acts as the positioning context
          for the envelope cover (absolute inset-0 inside it). */}
      <div
        className="relative min-h-dvh w-full overflow-hidden"
        style={{ maxWidth: "500px", backgroundColor: theme.bg }}
      >
        {/* External video — mounted immediately for preloading, revealed after animation */}
        {isExternalVideo && (
          <ExternalVideoPage
            ref={videoRef}
            videoUrl={invitation.videoUrl ?? ""}
            visible={videoVisible}
            invitation={invitation}
            theme={mergedTheme}
          />
        )}

        {/* External link iframe — same pattern: mounted immediately so the
            upstream Canva page (proxied through /canva-proxy) starts loading
            in parallel with the envelope animation, then revealed once the
            envelope finishes opening. */}
        {isExternalLink && (
          <ExternalLinkPage
            externalLink={effectiveExternalLink}
            visible={externalLinkVisible}
            lazyLoadIframe={lazyExternalIframe}
            guest={invitation.guest ?? null}
          />
        )}

        {/* Rich external link page — mounted immediately so its iframe and
            rich sections load in parallel with the envelope cover, then
            faded in when the envelope animation completes. */}
        {isRichExternalLink && (
          <motion.div
            aria-hidden={!richExternalLinkVisible}
            initial={false}
            animate={{ opacity: richExternalLinkVisible ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: richExternalLinkVisible ? "relative" : "absolute",
              inset: richExternalLinkVisible ? undefined : 0,
              zIndex: richExternalLinkVisible ? 1 : -1,
              overflow: richExternalLinkVisible ? "visible" : "hidden",
              pointerEvents: richExternalLinkVisible ? "auto" : "none",
            }}
          >
            <RichExternalLinkPage
              invitation={invitation}
              theme={theme}
              audioRef={audioRef}
              prefetchedVideoRef={
                isStandardWithVideo ? heroVideoRef : undefined
              }
              isLandingPreview={isLandingPreview}
              animateHeroText={richExternalLinkVisible}
              canvaPreloading={shouldPreloadRichExternalCanva({
                isPreview: false,
                isVisible: richExternalLinkVisible,
              })}
            />
          </motion.div>
        )}

        {/* Persistent prefetch video — mounted once and reused by InvitationPage
            via ref so the browser never re-downloads the video. `preload`
            stays at "metadata" until the user taps the envelope, at which
            point `handleOpen` upgrades it to a full fetch. This saves
            ~3 MB of mobile data for guests who never tap. */}
        {isStandardWithVideo && (
          <video
            ref={heroVideoRef}
            src={invitation.videoUrl!}
            preload="auto"
            muted
            loop
            playsInline
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

        {/* Persistent prefetch audio — mounted once, `preload="auto"` so the
            whole file downloads ahead of the tap and plays instantly on open.
            A matching <link rel="preload" as="audio"> in the server-rendered
            <head> (see page.tsx) starts this during HTML parse — before
            hydration and not subject to the mobile media-preload throttle.
            NOTE: `preload="metadata"` here is wrong — the element aborts the
            download after the header, which also cancels the head preload's
            full fetch, so only a few seconds buffer before the tap. */}
        {hasBackgroundAudio && (
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

        {/* Invitation content — rendered behind the cover, fades in immediately */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              key="invitation-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Envelope cover sits on top. Its final phase fades to the bg color,
            then it's removed from the DOM revealing the content beneath. */}
        <AnimatePresence>
          {coverVisible &&
            (usesVideoCover ? (
              <VideoSequenceCover
                key="video-sequence-cover"
                items={invitation.coverVideos!.items}
                onOpen={handleVideoCoverOpen}
                onPlaybackStart={startBackgroundAudio}
                onAnimationComplete={handleAnimationComplete}
                onUnavailable={() => setVideoCoverFailed(true)}
              />
            ) : (
              <EnvelopeCover
                key="envelope-cover"
                theme={mergedTheme}
                coverBackground={invitation.envelope?.coverBackground}
                onOpen={handleOpen}
                onAnimationComplete={handleAnimationComplete}
                monogram={invitation.couple.monogram}
                shimmer={invitation.envelope?.shimmer !== false}
                imageSettings={invitation.imageSettings}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
