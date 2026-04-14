"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { InvitationData } from "@/lib/types";
import { getModelComponent } from "@/components/models";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import ExternalVideoPage, {
  type ExternalVideoPageHandle,
} from "@/components/shared/ExternalVideoPage";
import { useAnalytics } from "@/hooks/useAnalytics";

interface InvitationViewProps {
  invitation: InvitationData;
}

export default function InvitationView({ invitation }: InvitationViewProps) {
  const [coverVisible, setCoverVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<ExternalVideoPageHandle | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const { styles } = invitation;

  const isExternalVideo =
    (invitation.invitationType ?? "standard") === "external_video";

  // Standard invitations with a hero video need the bytes pre-buffered
  // before the invite is opened, so the video plays instantly.
  const isStandardWithVideo =
    (invitation.invitationType ?? "standard") === "standard" &&
    !!invitation.videoUrl;

  // Likewise, pre-buffer the background audio so it plays immediately
  // when the user taps the envelope instead of waiting for a download.
  const isStandardWithAudio =
    (invitation.invitationType ?? "standard") === "standard" &&
    invitation.audio.enabled &&
    !!invitation.audio.src;

  const { trackEvent } = useAnalytics(invitation.slug);

  // Track page view on mount (deduplicated server-side per session)
  useEffect(() => {
    trackEvent("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** User tapped — start music (only for standard invites), track envelope open. */
  const handleOpen = useCallback(() => {
    trackEvent("envelope_open");

    // Use the pre-buffered <audio> element so playback starts instantly
    if (isStandardWithAudio) {
      try {
        const audio = audioRef.current;
        if (!audio) return;
        audio.loop = true;
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
    }
  }, [isStandardWithAudio, trackEvent]);

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
   * The envelope's internal animation sequence is done.
   * Show the invitation content instantly — the envelope's scene-fade
   * has already cross-dissolved to the bg color, so the transition
   * is seamless.
   */
  const handleAnimationComplete = useCallback(() => {
    const type = invitation.invitationType ?? "standard";

    // For external links, redirect the browser after the envelope animation
    if (type === "external_link" && invitation.externalLink) {
      window.location.href = invitation.externalLink;
      return;
    }

    // For external video: play imperatively (within the gesture context) and
    // reveal the video. The <video> element is already mounted and preloading.
    if (type === "external_video") {
      videoRef.current?.play();
      setVideoVisible(true);
      requestAnimationFrame(() => setCoverVisible(false));
      return;
    }

    setShowContent(true);
    requestAnimationFrame(() => {
      setCoverVisible(false);
    });
  }, [invitation.invitationType, invitation.externalLink]);

  /** Render the appropriate content based on invitation type. */
  function renderContent() {
    const type = invitation.invitationType ?? "standard";

    if (type === "external_link") {
      // Redirect is handled in handleAnimationComplete; render nothing here
      return null;
    }

    // Resolve the model component dynamically
    const ModelComponent = getModelComponent(invitation.modelComponent);
    if (!ModelComponent) {
      return (
        <div className="flex items-center justify-center min-h-dvh p-8 text-center">
          <p>Modelo &quot;{invitation.modelComponent}&quot; não encontrado.</p>
        </div>
      );
    }

    // Default: standard full invitation page via model component
    return (
      <ModelComponent
        invitation={invitation}
        styles={styles}
        audioRef={audioRef}
        prefetchedVideoRef={isStandardWithVideo ? heroVideoRef : undefined}
      />
    );
  }

  return (
    /* Outer full-screen layer — visible on wide screens as the side gutters */
    <div
      className="min-h-dvh flex justify-center"
      style={{ backgroundColor: styles.bg }}
    >
      {/* Inner column — capped at 500 px, acts as the positioning context
          for the envelope cover (absolute inset-0 inside it). */}
      <div
        className="relative min-h-dvh w-full overflow-hidden"
        style={{ maxWidth: "500px", backgroundColor: styles.bg }}
      >
        {/* External video — mounted immediately for preloading, revealed after animation */}
        {isExternalVideo && (
          <ExternalVideoPage
            ref={videoRef}
            videoUrl={invitation.videoUrl ?? ""}
            visible={videoVisible}
            invitation={invitation}
            theme={styles}
          />
        )}

        {/* Persistent prefetch video — mounted once and reused by model component
            via ref so the browser never re-downloads the video. */}
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

        {/* Persistent prefetch audio — mounted once so the browser downloads
            the audio file while the envelope animation is visible. Reused by
            handleOpen to start playback instantly without waiting for a fetch. */}
        {isStandardWithAudio && (
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
          {coverVisible && (
            <EnvelopeCover
              key="envelope-cover"
              theme={styles}
              onOpen={handleOpen}
              onAnimationComplete={handleAnimationComplete}
              monogram={invitation.couple.monogram}
              shimmer={styles.envelopeShimmer !== false}
              imageSettings={invitation.imageSettings}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
