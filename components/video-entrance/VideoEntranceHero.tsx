"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import type {
  CustomTexts,
  HeroOverlayConfig,
  HeroScrollIndicatorConfig,
  HeroTextLayer,
  InvitationData,
  InvitationEventType,
  ObjectFit,
  TemplateTheme,
  TextStyleOverrides,
} from "@/lib/types";
import { useCustomText } from "@/lib/custom-texts";
import HeroTextOverlay from "@/components/shared/HeroTextOverlay";
import VideoPosterLayer from "@/components/shared/VideoPosterLayer";
import { useVideoFrameReady } from "@/components/shared/useVideoFrameReady";
import { heroFontsFromTheme } from "@/lib/hero-text";
import { EditableText } from "@/components/shared/EditableText";
import {
  resolveTextElementOverride,
  scrollToNextHeroSection,
} from "@/lib/curtain-canva";
import {
  resolveHeroRevealSeconds,
  shouldRevealHeroAtTime,
} from "@/lib/video-entrance";
import {
  isEngagementEventType,
  isWeddingEventType,
} from "@/lib/invitation-event-types";
import {
  DEFAULT_HERO_GRADIENT_START_VIDEO,
  DEFAULT_HERO_SCRIM_OPACITY,
} from "@/components/shared/InvitationHero";
import {
  heroScrollIndicatorBottom,
  resolveHeroScrollIndicator,
} from "@/lib/hero-scroll-indicator";
import { InvitationLanguageSwitcher } from "@/components/shared/InvitationLanguageSwitcher";

interface VideoEntranceHeroProps {
  invitation: InvitationData;
  couple: InvitationData["couple"];
  /** Top text shown above the couple names. */
  topText?: string;
  quote: string;
  theme: TemplateTheme;
  audioRef: RefObject<HTMLAudioElement | null>;
  /** The single entrance video (invitation.videoUrl), used as cover + hero. */
  videoUrl?: string;
  /** Resolved hero media object-fit (defaults to "cover"). */
  mediaFit?: ObjectFit;
  /** Poster/first-frame still shown as the cover before the video plays. */
  videoPoster?: string;
  /** Admin-tunable scrim + bottom gradient over the video. */
  heroOverlay?: HeroOverlayConfig;
  /** Admin-tunable scroll-down indicator (defaults to on for this layout). */
  heroScrollIndicator?: HeroScrollIndicatorConfig;
  /** Seconds into the video at which the hero text reveals. */
  revealSeconds?: number;
  customTexts?: CustomTexts;
  textStyles?: TextStyleOverrides;
  /** Whether the celebration confetti fires when the text reveals. */
  confettiEnabled?: boolean;
  /** Whether the cover prompt (play button + tap hint) is shown before tapping. */
  showTapPrompt?: boolean;
  onTapped?: () => void;
  /** Fires once when the reveal completes so the parent can unlock scroll. */
  onRevealed?: () => void;
  eventType: InvitationEventType;
  /** Free-positioned custom text layer over the hero media. */
  heroTextLayer?: HeroTextLayer | null;
}

type HeroState = "idle" | "playing" | "revealed";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function VideoEntranceHero({
  invitation,
  couple,
  topText,
  quote,
  theme,
  audioRef,
  videoUrl,
  mediaFit = "cover",
  videoPoster,
  heroOverlay,
  heroScrollIndicator,
  revealSeconds,
  customTexts,
  textStyles,
  confettiEnabled = false,
  showTapPrompt = true,
  onTapped,
  onRevealed,
  eventType,
  heroTextLayer,
}: VideoEntranceHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const hideDefaultHeroText = heroTextLayer?.hideDefaultText === true;
  const heroFonts = heroFontsFromTheme(theme, textStyles);
  const scrollIndicator = resolveHeroScrollIndicator(heroScrollIndicator, {
    defaultEnabled: true,
    defaultSize: 28,
  });

  const topTextOverride = resolveTextElementOverride(textStyles, "heroTopText");
  const coupleNamesOverride = resolveTextElementOverride(
    textStyles,
    "coupleNames",
  );
  const ampersandOverride = resolveTextElementOverride(textStyles, "ampersand");
  const quoteOverride = resolveTextElementOverride(textStyles, "quote");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<HeroState>("idle");
  const [heroInfoVisible, setHeroInfoVisible] = useState(false);
  const confettiFiredRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const revealThreshold = resolveHeroRevealSeconds(revealSeconds);
  const t = useCustomText(customTexts);
  const tapLabel = t("curtain_tapToOpen");
  const heroVideoOn =
    typeof videoUrl === "string" && videoUrl.trim().length > 0;
  const videoReady = useVideoFrameReady(videoRef, videoUrl ?? "");

  const scrimOpacity = clamp(
    heroOverlay?.scrimOpacity ?? DEFAULT_HERO_SCRIM_OPACITY,
    0,
    1,
  );
  const gradientStart = clamp(
    heroOverlay?.gradientStart ?? DEFAULT_HERO_GRADIENT_START_VIDEO,
    0,
    100,
  );

  // Notify the parent once when revealed so it can unlock page scroll.
  const revealedNotified = useRef(false);
  useEffect(() => {
    if (state === "revealed" && !revealedNotified.current) {
      revealedNotified.current = true;
      onRevealed?.();
    }
  }, [state, onRevealed]);

  // Nudge mobile WebKit to start downloading the video on mount.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.load();
    } catch {
      /* some browsers throw if load() is called too early — ignore */
    }
  }, []);

  // Clear any running audio fade on unmount.
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, []);

  const reveal = useCallback(() => {
    setHeroInfoVisible(true);
    setState("revealed");
  }, []);

  const fireConfetti = useCallback(() => {
    if (!confettiEnabled) return;
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;

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
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    confetti({
      particleCount: 80,
      spread: 100,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.6 },
      colors,
      zIndex: 50,
    });
    requestAnimationFrame(frame);
  }, [confettiEnabled, theme.accent, theme.monogramColor, theme.textPrimary]);

  const handleTap = useCallback(() => {
    if (state !== "idle") return;
    setState("playing");
    onTapped?.();

    // Background music starts in the same gesture so iOS allows it. The video
    // stays muted (per spec). Mirror the curtain-canva fade-in.
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.volume = 0.03;
      audio
        .play()
        .then(() => {
          let vol = 0.03;
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
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

    const video = videoRef.current;
    if (video) {
      video.play().catch(() => reveal());
    } else {
      reveal();
    }

    // Reduced motion: don't make the guest wait on the timer — reveal now.
    if (prefersReducedMotion) {
      reveal();
      fireConfetti();
    }
  }, [state, onTapped, audioRef, prefersReducedMotion, reveal, fireConfetti]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (
      !heroInfoVisible &&
      shouldRevealHeroAtTime(video.currentTime, revealThreshold)
    ) {
      reveal();
      fireConfetti();
    }
  }, [heroInfoVisible, revealThreshold, reveal, fireConfetti]);

  const handleVideoEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      try {
        // Freeze on the last frame.
        video.currentTime = Math.max(video.duration - 0.05, 0);
        video.pause();
      } catch {
        /* ignore */
      }
    }
    // Ensure the text is revealed even if revealSeconds was longer than the video.
    reveal();
    fireConfetti();
  }, [reveal, fireConfetti]);

  const handleVideoError = useCallback(() => {
    reveal();
  }, [reveal]);

  const handleScrollNext = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      scrollToNextHeroSection();
    },
    [],
  );

  const isInteractive = state === "idle";

  return (
    <section
      id="hero"
      className="relative w-full h-dvh overflow-hidden select-none"
      style={{
        cursor: isInteractive ? "pointer" : "default",
        containerType: "inline-size",
        backgroundColor: theme.bg,
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
      <VideoPosterLayer
        posterUrl={videoPoster}
        visible={!videoReady}
        mediaFit={mediaFit}
        zIndex={state === "revealed" ? 1 : 9}
      />

      {heroVideoOn && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={videoPoster}
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onTimeUpdate={handleVideoTimeUpdate}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: state === "revealed" ? 2 : 8, objectFit: mediaFit }}
        />
      )}

      {/* Scrim for legibility over bright video. */}
      {scrimOpacity > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${scrimOpacity})`, zIndex: 3 }}
        />
      )}
      {/* Bottom gradient fading into the theme background. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent ${gradientStart}%, ${theme.bg} 100%)`,
          zIndex: 3,
        }}
      />

      {heroInfoVisible && (
        <InvitationLanguageSwitcher invitation={invitation} />
      )}

      {/* Idle: play affordance + tap hint. Hidden when the admin disables the
          prompt — the cover stays tappable either way. */}
      <AnimatePresence>
        {isInteractive && showTapPrompt && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: "rgba(255,255,255,0.85)",
                color: theme.textPrimary,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-9 w-9"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span
              className="uppercase"
              style={{
                fontFamily: theme.uiFont,
                color: "#ffffff",
                fontSize: 12,
                letterSpacing: "0.3em",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              {tapLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed hero text: top text → names → quote. */}
      <AnimatePresence>
        {heroInfoVisible && !hideDefaultHeroText && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-10 md:px-16 max-w-3xl mx-auto z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {topText && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="uppercase"
                style={{
                  fontFamily: theme.uiFont,
                  color: theme.textSecondary,
                  fontSize: "clamp(0.7rem, 2vw, 0.85rem)",
                  letterSpacing: "0.3em",
                  ...topTextOverride,
                }}
              >
                <EditableText elementKey="heroTopText">{topText}</EditableText>
              </motion.p>
            )}

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
              {(isWeddingEventType(eventType) ||
                isEngagementEventType(eventType)) && (
                <>
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
                </>
              )}
            </motion.h1>

            {quote && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8 italic"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free-positioned custom text layer (revealed state). */}
      {heroInfoVisible && (
        <HeroTextOverlay layer={heroTextLayer} fonts={heroFonts} play />
      )}

      {/* Scroll-down chevron after reveal. */}
      <AnimatePresence>
        {heroInfoVisible && scrollIndicator.enabled && (
          <motion.button
            type="button"
            aria-label="Scroll to next section"
            className="absolute left-1/2 z-20 flex -translate-x-1/2 items-center justify-center rounded-full bg-white/70 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              width: scrollIndicator.buttonSize,
              height: scrollIndicator.buttonSize,
              bottom: heroScrollIndicatorBottom(
                "2rem",
                scrollIndicator.offsetY,
              ),
              borderColor: `${theme.textPrimary}33`,
              color: heroScrollIndicator?.color || theme.textPrimary,
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
              width={scrollIndicator.iconSize}
              height={scrollIndicator.iconSize}
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
