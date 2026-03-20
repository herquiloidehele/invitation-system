"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import InvitationPage from "@/components/shared/InvitationPage";
import { useAnalytics } from "@/hooks/useAnalytics";

interface InvitationViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function InvitationView({
  invitation,
  theme,
}: InvitationViewProps) {
  const [coverVisible, setCoverVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { trackEvent } = useAnalytics(invitation.slug);

  // Track page view on mount (deduplicated server-side per session)
  useEffect(() => {
    trackEvent("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** User tapped — start music, track envelope open, and let the envelope animate. */
  const handleOpen = useCallback(() => {
    trackEvent("envelope_open");

    if (invitation.audio.enabled) {
      try {
        const audio = new Audio(invitation.audio.src);
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
        audioRef.current = audio;
      } catch {
        /* silent */
      }
    }
  }, [invitation.audio, trackEvent]);

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
    setShowContent(true);
    // Remove the cover from the DOM on the next frame
    // (after content is already rendering underneath)
    requestAnimationFrame(() => setCoverVisible(false));
  }, []);

  return (
    /* Outer full-screen layer — visible on wide screens as the side gutters */
    <div
      className="min-h-dvh flex justify-center"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Inner column — capped at 500 px, acts as the positioning context
          for the envelope cover (absolute inset-0 inside it). */}
      <div
        className="relative min-h-dvh w-full"
        style={{ maxWidth: "500px", backgroundColor: theme.bg }}
      >
        {/* Invitation content — rendered behind the cover, fades in immediately */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              key="invitation-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <InvitationPage
                invitation={invitation}
                theme={theme}
                audioRef={audioRef}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Envelope cover sits on top. Its final phase fades to the bg color,
            then it's removed from the DOM revealing the content beneath. */}
        <AnimatePresence>
          {coverVisible && (
            <EnvelopeCover
              key="envelope-cover"
              theme={theme}
              onOpen={handleOpen}
              onAnimationComplete={handleAnimationComplete}
              monogram={invitation.couple.monogram}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
