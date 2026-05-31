"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import type {
  CustomTexts,
  InvitationData,
  TemplateTheme,
  TextStyleOverrides,
} from "@/lib/types";
import { t } from "@/lib/custom-texts";
import { EditableText } from "@/components/shared/EditableText";
import {
  resolveCurtainVideoSrc,
  resolveTextElementOverride,
  scrollToNextHeroSection,
  shouldFireConfettiAtProgress,
  shouldShowHeroInfoAtProgress,
} from "@/lib/curtain-canva";

interface CurtainsHeroProps {
  couple: InvitationData["couple"];
  quote: string;
  inviteMessage?: string;
  theme: TemplateTheme;
  audioRef: RefObject<HTMLAudioElement | null>;
  videoUrl?: string;
  videoPoster?: string;
  customTexts?: CustomTexts;
  /**
   * Per-invitation text style overrides. Applied on top of the hero's
   * default inline styles so admin element-level customizations (couple
   * names, ampersand, quote, invite message) win without losing the
   * curtain-specific typography defaults (clamp sizing, etc.).
   */
  textStyles?: TextStyleOverrides;
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
  quote,
  inviteMessage,
  theme,
  audioRef,
  videoUrl,
  videoPoster,
  customTexts,
  textStyles,
  onTapped,
  onRevealed,
}: CurtainsHeroProps) {
  // Per-element overrides applied to inline styles below. Resolved once
  // per render so we keep the existing curtain typography defaults and
  // only merge in the admin's customizations.
  const coupleNamesOverride = resolveTextElementOverride(
    textStyles,
    "coupleNames",
  );
  const ampersandOverride = resolveTextElementOverride(textStyles, "ampersand");
  const quoteOverride = resolveTextElementOverride(textStyles, "quote");
  const inviteMessageOverride = resolveTextElementOverride(
    textStyles,
    "inviteMessage",
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<HeroState>("idle");
  const [heroInfoVisible, setHeroInfoVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // Tracks whether the celebratory confetti has already fired in this play
  // session. Confetti is triggered at ~80% of the curtain video so the
  // burst lands as the curtain finishes opening; this ref prevents the
  // burst from re-firing on every subsequent `timeupdate` and from
  // double-firing alongside the on-end fallback below.
  const confettiFiredRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Force the browser to start downloading the video as soon as the hero
  // mounts. Mobile WebKit often downgrades `preload="auto"` to "metadata"
  // until something nudges it; calling `load()` explicitly kicks off the
  // fetch so playback starts almost instantly when the user taps.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.load();
    } catch {
      /* some browsers throw if load() is called too early — ignore */
    }
  }, []);

  // Unmount cleanup: stop the audio fade if it is still running. The
  // parent (`CurtainCanvaPage`) handles pausing the audio element itself,
  // but if we leave the interval ticking it keeps mutating audio.volume
  // on a paused element after the component is gone.
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, []);

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
          // Clear any prior fade (e.g. fast double-tap) before starting a new one.
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
          }
          const fade = setInterval(() => {
            vol = Math.min(vol + 0.02, 0.5);
            audio.volume = vol;
            if (vol >= 0.5) {
              clearInterval(fade);
              if (fadeIntervalRef.current === fade) {
                fadeIntervalRef.current = null;
              }
            }
          }, 200);
          fadeIntervalRef.current = fade;
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

  const fireConfetti = useCallback(() => {
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;

    // Two side cannons firing inward for a celebratory wedding burst.
    // Colors are pulled from the active theme so the confetti feels at
    // home with the invitation palette.
    const colors = [
      theme.accent,
      theme.monogramColor || theme.accent,
      theme.textPrimary,
      "#ffffff",
    ].filter(Boolean) as string[];

    const duration = 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 10,
        angle: 60,
        spread: 70,
        startVelocity: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        zIndex: 50,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial center burst for impact, then trailing side cannons.
    confetti({
      particleCount: 80,
      spread: 100,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.6 },
      colors,
      zIndex: 50,
    });
    requestAnimationFrame(frame);
  }, [theme.accent, theme.monogramColor, theme.textPrimary]);

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
    fireConfetti();
  }, [fireConfetti]);

  const handleVideoError = useCallback(() => {
    setHeroInfoVisible(true);
    setState("revealed");
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (
      !heroInfoVisible &&
      shouldShowHeroInfoAtProgress(video.currentTime, video.duration)
    ) {
      setHeroInfoVisible(true);
    }

    // Fire confetti once the curtain video crosses the celebration
    // threshold (default 80%). The `fireConfetti` helper has its own
    // run-once guard so this is safe to call on every `timeupdate`.
    if (
      !confettiFiredRef.current &&
      shouldFireConfettiAtProgress(video.currentTime, video.duration)
    ) {
      fireConfetti();
    }
  }, [fireConfetti, heroInfoVisible]);

  // Fired once the video element has rendered its first frame and is
  // actually progressing. We use this to fade out the poster overlay so
  // the swap from poster image → video is invisible to the user.
  const handleVideoPlaying = useCallback(() => {
    setVideoReady(true);
  }, []);

  const handleScrollNext = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      scrollToNextHeroSection();
    },
    [],
  );

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
      {/* Poster overlay painted as a background image directly on the
          section. Sits behind the <video> and stays opaque until playback
          actually starts (`playing` event), so the user never sees a blank
          rectangle while the browser swaps from poster → first decoded
          frame. The fade-out is brief so the transition feels instant. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${videoPoster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: videoReady ? 0 : 1,
          transition: "opacity 200ms ease-out",
          zIndex: 1,
        }}
      />

      <video
        ref={videoRef}
        src={videoSrc}
        poster={videoPoster}
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        onPlaying={handleVideoPlaying}
        onTimeUpdate={handleVideoTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ cursor: isInteractive ? "pointer" : "default", zIndex: 2 }}
      />

      {/* Hero info (monogram, names, quote). Fades in when the curtain video
          reaches the configured progress threshold (default 80%) so it is
          in place before the curtain is fully open. The date is shown later
          in the dedicated scratch-reveal section, not here. */}
      <AnimatePresence>
        {heroInfoVisible && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-10 md:px-16 max-w-3xl mx-auto z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {quote && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="italic"
                style={{
                  fontFamily: theme.bodyFont,
                  color: theme.textMuted,
                  fontSize: "clamp(1rem, 2.4vw, 1.15rem)",
                  lineHeight: 1.6,
                  maxWidth: "38ch",
                  ...quoteOverride,
                }}
              >
                <EditableText elementKey="quote">{quote}</EditableText>
              </motion.p>
            )}

            {/* Couple names stacked vertically: name / & / name. Each line
                gets its own block so long names never collide on narrow
                viewports. */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-5 flex flex-col items-center"
              style={{
                fontFamily: theme.displayFont,
                color: theme.textPrimary,
                fontSize: "clamp(1.75rem, 7.5vw, 2.75rem)",
                lineHeight: 1.15,
                fontWeight: 500,
                wordBreak: "break-word",
                hyphens: "auto",
                ...coupleNamesOverride,
              }}
            >
              <span>
                <EditableText elementKey="coupleNames">
                  {couple.bride}
                </EditableText>
              </span>
              <span
                aria-hidden
                className="my-1"
                style={{
                  opacity: 0.55,
                  fontStyle: "italic",
                  fontSize: "0.85em",
                  ...ampersandOverride,
                }}
              >
                <EditableText elementKey="ampersand">&amp;</EditableText>
              </span>
              <span>
                <EditableText elementKey="coupleNames">
                  {couple.groom}
                </EditableText>
              </span>
            </motion.h1>

            {inviteMessage && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8"
                style={{
                  fontFamily: theme.bodyFont,
                  color: theme.textMuted,
                  fontSize: "clamp(0.9rem, 2.2vw, 1.05rem)",
                  lineHeight: 1.6,
                  maxWidth: "40ch",
                  ...inviteMessageOverride,
                }}
              >
                <EditableText elementKey="inviteMessage">
                  {inviteMessage}
                </EditableText>
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {heroInfoVisible && (
          <motion.button
            type="button"
            aria-label="Scroll to next section"
            className="absolute left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-white/70  transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              bottom: "calc(env(safe-area-inset-bottom) + 2rem)",
              borderColor: `${theme.textPrimary}33`,
              color: theme.textPrimary,
              cursor: "pointer",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, 9, 0] }}
            exit={{ opacity: 0, y: 10 }}
            transition={{
              opacity: { delay: 0.8, duration: 0.35 },
              y: {
                delay: 1,
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            onClick={handleScrollNext}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
