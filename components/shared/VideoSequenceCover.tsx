"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import type { CoverVideoItem } from "@/lib/types";
import { isValidCoverVideoItem, nextCoverStep } from "@/lib/cover-videos";

interface VideoSequenceCoverProps {
  /** Ordered clips (1–4). */
  items: CoverVideoItem[];
  /** Fired on the tap-to-begin gesture (parent upgrades hero prefetch). */
  onOpen: () => void;
  /** Fired after the last clip (or a mid-sequence failure/stall/skip) → parent reveals the invitation. */
  onAnimationComplete: () => void;
  /**
   * Fired when the first clip fails to load *before* playback starts, so the
   * parent can fall back to the standard envelope cover.
   */
  onUnavailable?: () => void;
}

/** Seconds of overlap for the crossfade between consecutive clips. */
const CROSSFADE_SEC = 0.5;
/** If the active clip makes no progress for this long (buffering stall or a
 *  blocked autoplay), fail open to the invitation rather than dead-ending. */
const STALL_TIMEOUT_MS = 10000;
/** Delay before the "skip" affordance appears, so it doesn't distract up front. */
const SKIP_DELAY_MS = 2500;

/** Play a clip, retrying muted if autoplay-with-sound is rejected (some strict
 *  in-app WebViews block sounded playback even inside a gesture) so it plays
 *  rather than stalling silently. */
function playWithFallback(el: HTMLVideoElement | null) {
  if (!el) return;
  el.play().catch(() => {
    el.muted = true;
    el.play().catch(() => {});
  });
}

/**
 * Tap-to-play cover that plays a sequence of videos with a crossfade between
 * them, then hands off to the invitation page. On tap, every remaining clip
 * starts buffering in parallel so each is ready by its turn; already-played
 * clips unmount and are reclaimed. Before the tap only the first clip loads
 * its metadata, so guests who never open the invitation don't download the
 * whole sequence. Fails open (hands off) on load failure or a buffering stall,
 * and offers a skip control so a guest is never trapped.
 */
export default function VideoSequenceCover({
  items,
  onOpen,
  onAnimationComplete,
  onUnavailable,
}: VideoSequenceCoverProps) {
  const t = useTranslations("Invitation");
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [crossfading, setCrossfading] = useState(false);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const failedRef = useRef<Set<number>>(new Set());
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRampRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ignore malformed clips defensively (the API stores coverVideos unvalidated).
  const clips = items.filter(isValidCoverVideoItem);
  const total = clips.length;

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const clearAudioRamp = useCallback(() => {
    if (audioRampRef.current) {
      clearInterval(audioRampRef.current);
      audioRampRef.current = null;
    }
  }, []);

  const handoff = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearWatchdog();
    clearAudioRamp();
    onAnimationComplete();
  }, [onAnimationComplete, clearWatchdog, clearAudioRamp]);

  /** Arm the stall watchdog for the active clip; cleared on the next progress. */
  const armWatchdog = useCallback(() => {
    clearWatchdog();
    watchdogRef.current = setTimeout(() => handoff(), STALL_TIMEOUT_MS);
  }, [clearWatchdog, handoff]);

  /** Duck the outgoing clip's audio to 0 and bring the incoming up over the
   *  crossfade, so two soundtracks don't collide at full volume. */
  const rampCrossfadeAudio = useCallback(
    (from: HTMLVideoElement | null, to: HTMLVideoElement | null) => {
      clearAudioRamp();
      const steps = 20;
      const stepMs = (CROSSFADE_SEC * 1000) / steps;
      let i = 0;
      audioRampRef.current = setInterval(() => {
        i += 1;
        const p = Math.min(i / steps, 1);
        try {
          if (from) from.volume = Math.max(0, 1 - p);
        } catch {
          /* ignore */
        }
        try {
          if (to) to.volume = Math.min(1, p);
        } catch {
          /* ignore */
        }
        if (p >= 1) clearAudioRamp();
      }, stepMs);
    },
    [clearAudioRamp],
  );

  const handleTap = useCallback(() => {
    if (startedRef.current) return; // idempotent against rapid double-taps
    startedRef.current = true;
    setStarted(true);
    onOpen();
    // Buffer every clip in parallel the moment the guest commits.
    for (let i = 0; i < total; i++) {
      const v = videoRefs.current[i];
      if (v) v.preload = "auto";
    }
    // Unmute + play clip 1 within the gesture (with a muted retry on rejection).
    const first = videoRefs.current[0];
    if (first) {
      first.muted = false;
      first.volume = 1;
      playWithFallback(first);
    }
  }, [onOpen, total]);

  /** Begin overlapping the current clip with the next as it nears its end. */
  const handleTimeUpdate = useCallback(
    (index: number) => {
      if (index !== activeIndex) return;
      clearWatchdog(); // active clip is progressing → not stalled
      if (crossfading) return;
      if (index >= total - 1) return; // last clip: wait for onEnded → handoff
      if (failedRef.current.has(index + 1)) return; // next clip broken → no crossfade
      const el = videoRefs.current[index];
      // Skip the crossfade when duration is unknown or shorter than the window.
      if (
        !el ||
        !Number.isFinite(el.duration) ||
        el.duration <= CROSSFADE_SEC
      ) {
        return;
      }
      if (el.currentTime >= el.duration - CROSSFADE_SEC) {
        setCrossfading(true);
        const next = videoRefs.current[index + 1];
        if (next) {
          next.currentTime = 0;
          next.volume = 0;
          playWithFallback(next);
          rampCrossfadeAudio(el, next);
        }
      }
    },
    [activeIndex, crossfading, total, clearWatchdog, rampCrossfadeAudio],
  );

  /** A clip reached its natural end: advance to the next or hand off. */
  const handleEnded = useCallback(
    (index: number) => {
      if (index !== activeIndex) return;
      clearAudioRamp();
      const step = nextCoverStep(index, total);
      // Hand off after the last clip, or if the next clip failed to load.
      if (step.kind === "handoff" || failedRef.current.has(step.index)) {
        handoff();
        return;
      }
      const nextEl = videoRefs.current[step.index];
      if (nextEl) {
        try {
          nextEl.volume = 1; // snap to full in case the ramp didn't finish
        } catch {
          /* ignore */
        }
      }
      setCrossfading(false);
      setActiveIndex(step.index);
    },
    [activeIndex, total, handoff, clearAudioRamp],
  );

  const handleError = useCallback(
    (index: number) => {
      failedRef.current.add(index);
      // Pre-start failure of the first clip → fall back to the envelope.
      if (!started && index === 0) {
        onUnavailable?.();
        return;
      }
      // Active clip failed mid-sequence → skip straight to the invitation.
      if (started && index === activeIndex) {
        handoff();
      }
    },
    [started, activeIndex, onUnavailable, handoff],
  );

  /** Active clip is buffering/stalled — arm the watchdog to fail open. */
  const handleWaiting = useCallback(
    (index: number) => {
      if (started && index === activeIndex && !doneRef.current) armWatchdog();
    },
    [started, activeIndex, armWatchdog],
  );

  // Empty sequence → hand off immediately.
  useEffect(() => {
    if (total === 0) handoff();
  }, [total, handoff]);

  // Ensure the active clip is playing (covers a blocked crossfade pre-play),
  // and arm the stall watchdog so a clip that never progresses fails open.
  useEffect(() => {
    if (!started) return;
    const el = videoRefs.current[activeIndex];
    if (el && el.paused) playWithFallback(el);
    armWatchdog();
  }, [started, activeIndex, armWatchdog]);

  // Reveal the skip affordance a moment after playback begins.
  useEffect(() => {
    if (!started) return;
    const tmr = setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    return () => clearTimeout(tmr);
  }, [started]);

  // Tidy timers on unmount.
  useEffect(() => {
    return () => {
      clearWatchdog();
      clearAudioRamp();
    };
  }, [clearWatchdog, clearAudioRamp]);

  // Mount the active clip and every clip after it, so on tap they can all
  // preload in parallel; already-played clips (< activeIndex) unmount.
  const mountedIndices = clips
    .map((_, i) => i)
    .filter((i) => i >= activeIndex);

  // Cold start with no paintable frame yet (no poster, metadata still loading)
  // → show a loading shimmer instead of a dead black screen.
  const showShimmer = !started && !firstFrameReady && !clips[0]?.poster;

  return (
    <motion.div
      className={`absolute inset-0 z-[100] overflow-hidden bg-black${
        started ? "" : " cursor-pointer"
      }`}
      role={started ? undefined : "button"}
      tabIndex={started ? -1 : 0}
      aria-label={started ? undefined : t("curtain_tapToOpen")}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (!started && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleTap();
        }
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {mountedIndices.map((i) => {
        // Active clip is visible; the next fades in during a crossfade; clips
        // beyond it stay invisible (opacity 0) while they preload.
        let opacity = 0;
        if (i === activeIndex) opacity = crossfading ? 0 : 1;
        else if (i === activeIndex + 1) opacity = crossfading ? 1 : 0;
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity }}
            transition={{
              duration: crossfading ? CROSSFADE_SEC : 0,
              ease: "easeInOut",
            }}
          >
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={clips[i].url}
              // Poster only matters for the pre-tap first clip; the preloading
              // "next" clip is invisible, so don't fetch its poster.
              poster={!started && i === 0 ? clips[i].poster : undefined}
              muted={!started}
              playsInline
              preload={!started ? (i === 0 ? "metadata" : "none") : "auto"}
              className="h-full w-full object-cover"
              onLoadedData={
                i === 0 ? () => setFirstFrameReady(true) : undefined
              }
              onTimeUpdate={() => handleTimeUpdate(i)}
              onEnded={() => handleEnded(i)}
              onError={() => handleError(i)}
              onWaiting={() => handleWaiting(i)}
              onStalled={() => handleWaiting(i)}
              onPlaying={() => {
                if (i === activeIndex) clearWatchdog();
              }}
            />
          </motion.div>
        );
      })}

      {/* Loading shimmer while clip 1 has no paintable frame yet (cold start,
          no poster) — so the guest sees "loading", not a dead black screen. */}
      {showShimmer && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Progress dots (multi-clip only). */}
      {started && total > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {clips.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 16 : 6,
                background:
                  i === activeIndex
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      )}

      {/* Skip affordance — appears shortly after start; also the escape hatch
          if a clip stalls. */}
      {started && showSkip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handoff();
          }}
          className="absolute bottom-5 right-4 z-20 rounded-full bg-black/35 px-3 py-1.5 text-xs uppercase text-white/85 backdrop-blur-sm"
          style={{ letterSpacing: "0.15em" }}
        >
          {t("cover_skip")} ›
        </button>
      )}
    </motion.div>
  );
}
