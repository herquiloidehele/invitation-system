"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CustomTexts, InvitationData, TemplateTheme } from "@/lib/types";
import { t } from "@/lib/custom-texts";
import {
  resolveCurtainVideoSrc,
  shouldShowHeroInfoAtProgress,
} from "@/lib/curtain-canva";

interface CurtainsHeroProps {
  couple: InvitationData["couple"];
  date: InvitationData["date"];
  quote: string;
  theme: TemplateTheme;
  audioRef: RefObject<HTMLAudioElement | null>;
  videoUrl?: string;
  customTexts?: CustomTexts;
  onTapped?: () => void;
  /**
   * Fires when the curtain reveal completes (video ended or reduced-motion
   * skip). Lets the parent unlock page scroll, which is gated to the hero
   * until the curtains are open.
   */
  onRevealed?: () => void;
}

type HeroState = "idle" | "playing" | "revealed";

export default function CurtainsHero({
  couple,
  date,
  quote,
  theme,
  audioRef,
  videoUrl,
  customTexts,
  onTapped,
  onRevealed,
}: CurtainsHeroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<HeroState>("idle");
  const [heroInfoVisible, setHeroInfoVisible] = useState(false);

  // Notify the parent the first time we reach the revealed state so it can
  // unlock the page scroll. Fires for both the natural video-end path and
  // the reduced-motion / video-error skip paths.
  const revealedNotified = useRef(false);
  useEffect(() => {
    if (state === "revealed" && !revealedNotified.current) {
      revealedNotified.current = true;
      onRevealed?.();
    }
  }, [state, onRevealed]);

  const tapLabel = t(customTexts, "curtain_tapToOpen");
  const videoSrc = resolveCurtainVideoSrc(videoUrl);

  const handleTap = useCallback(() => {
    if (state !== "idle") return;

    setState("playing");
    onTapped?.();

    // Start audio in the same gesture so iOS allows it.
    // Mirror the InvitationView pattern: low volume → fade up to 0.5 over ~5s.
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.volume = 0.03;
      audio
        .play()
        .then(() => {
          let vol = 0.03;
          const fade = setInterval(() => {
            vol = Math.min(vol + 0.02, 0.5);
            audio.volume = vol;
            if (vol >= 0.5) clearInterval(fade);
          }, 200);
        })
        .catch(() => {
          /* autoplay rejection — keep silent */
        });
    }

    // Start video
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // If video fails to play, jump straight to revealed
        setState("revealed");
      });
    } else {
      setState("revealed");
    }
  }, [state, onTapped, audioRef]);

  const handleVideoEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      try {
        video.currentTime = Math.max(video.duration - 0.05, 0);
        video.pause();
      } catch {
        /* ignore */
      }
    }
    setHeroInfoVisible(true);
    setState("revealed");
  }, []);

  const handleVideoError = useCallback(() => {
    setHeroInfoVisible(true);
    setState("revealed");
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (heroInfoVisible) return;
    const video = videoRef.current;
    if (!video) return;
    if (shouldShowHeroInfoAtProgress(video.currentTime, video.duration)) {
      setHeroInfoVisible(true);
    }
  }, [heroInfoVisible]);

  // Whole hero is the tap target while idle.
  const isInteractive = state === "idle";

  return (
    <section
      id="hero"
      className="relative w-full h-dvh overflow-hidden select-none"
      style={{
        // ...containerStyle,
        cursor: isInteractive ? "pointer" : "default",
      }}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? tapLabel : undefined}
      onClick={isInteractive ? handleTap : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTap();
              }
            }
          : undefined
      }
    >
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        onTimeUpdate={handleVideoTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ cursor: isInteractive ? "pointer" : "default" }}
      />

      {/* Hero info (monogram, names, date, quote). Fades in when the curtain
          video reaches the configured progress threshold (default 80%) so it
          is in place before the curtain is fully open. */}
      <AnimatePresence>
        {heroInfoVisible && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 sm:px-14 md:px-20 max-w-2xl mx-auto z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{
                fontFamily: theme.scriptFont || theme.displayFont,
                color: theme.monogramColor || theme.accent,
                fontSize: "clamp(2.25rem, 8vw, 3.25rem)",
                lineHeight: 1,
              }}
            >
              {couple.monogram}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-5"
              style={{
                fontFamily: theme.displayFont,
                color: theme.textPrimary,
                fontSize: "clamp(1.75rem, 7.5vw, 2.75rem)",
                lineHeight: 1.15,
                fontWeight: 500,
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {couple.bride}
              <br className="sm:hidden" />
              <span
                className="sm:inline mx-3 align-baseline"
                style={{ opacity: 0.55, fontStyle: "italic" }}
              >
                &
              </span>
              {couple.groom}
            </motion.h1>

            {(date.dayOfWeek || date.display) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-7 flex flex-col items-center gap-2"
              >
                {/* Decorative gold rule */}
                <span
                  aria-hidden
                  style={{
                    width: 56,
                    height: 1,
                    background: theme.accent || "#C9A961",
                    opacity: 0.7,
                  }}
                />
                <p
                  className="uppercase"
                  style={{
                    fontFamily: theme.uiFont,
                    color: theme.textSecondary,
                    fontSize: 12,
                    letterSpacing: "0.28em",
                  }}
                >
                  {[date.dayOfWeek, date.display].filter(Boolean).join("  ·  ")}
                </p>
                <span
                  aria-hidden
                  style={{
                    width: 56,
                    height: 1,
                    background: theme.accent || "#C9A961",
                    opacity: 0.7,
                  }}
                />
              </motion.div>
            )}

            {quote && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-6 italic"
                style={{
                  fontFamily: theme.bodyFont,
                  color: theme.textMuted,
                  fontSize: "clamp(0.95rem, 2.4vw, 1.05rem)",
                  lineHeight: 1.55,
                  maxWidth: "32ch",
                }}
              >
                {quote}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
