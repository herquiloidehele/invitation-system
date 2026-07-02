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
  /** Fired once when a clip actually starts progressing (currentTime > 0), so
   *  the parent can sync the background music to real playback rather than the
   *  bare tap — never audible while the video buffers or fails to render. */
  onPlaybackStart?: () => void;
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
 * clips unmount and are reclaimed. The first clip preloads in the background so
 * it starts fast on tap; the tap is available immediately and a single spinner
 * shows only after the tap while the clip isn't painting yet. Fails open (hands
 * off) on load failure or a buffering stall.
 */
export default function VideoSequenceCover({
  items,
  onOpen,
  onPlaybackStart,
  onAnimationComplete,
  onUnavailable,
}: VideoSequenceCoverProps) {
  const t = useTranslations("Invitation");
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [crossfading, setCrossfading] = useState(false);
  // Per-clip flag: true once the clip's <video> is actually painting frames,
  // so we hide its poster <img> overlay exactly then (no black gap on tap).
  const [painted, setPainted] = useState<Record<number, boolean>>({});

  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const playbackStartedRef = useRef(false);
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

  /** A clip actually progressed (a real frame rendered): hide its poster
   *  overlay, and on the very first one tell the parent playback has truly
   *  started, so it can start the music in sync — not on the bare tap. */
  const markPainted = useCallback(
    (index: number) => {
      setPainted((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
      if (!playbackStartedRef.current) {
        playbackStartedRef.current = true;
        onPlaybackStart?.();
      }
    },
    [onPlaybackStart],
  );

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

  // Tidy timers on unmount.
  useEffect(() => {
    return () => {
      clearWatchdog();
      clearAudioRamp();
    };
  }, [clearWatchdog, clearAudioRamp]);

  // Mount the active clip and every clip after it, so on tap they can all
  // preload in parallel; already-played clips (< activeIndex) unmount.
  const mountedIndices = clips.map((_, i) => i).filter((i) => i >= activeIndex);

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
        const poster = clips[i].poster;
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
              muted={!started}
              playsInline
              // Buffer clip 1 up front so it starts fast on tap; the rest load
              // on tap.
              preload={!started ? (i === 0 ? "auto" : "none") : "auto"}
              className="h-full w-full object-cover"
              onTimeUpdate={(e) => {
                if (e.currentTarget.currentTime > 0) markPainted(i);
                handleTimeUpdate(i);
              }}
              onEnded={() => handleEnded(i)}
              onError={() => handleError(i)}
              onWaiting={() => handleWaiting(i)}
              onStalled={() => handleWaiting(i)}
              onPlaying={() => {
                if (i === activeIndex) clearWatchdog();
              }}
            />
            {/* Poster image overlay — sits on top of the <video> and is removed
                only once the clip is actually painting frames (onPlaying / first
                timeupdate). This guarantees no black gap between tapping and the
                first video frame, which the native <video poster> attribute does
                not reliably prevent across browsers. */}
            {poster && !painted[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}
          </motion.div>
        );
      })}

      {/* Single buffering spinner — shown only after the tap while the active
          clip isn't painting a frame yet (so it appears once, only if playback
          isn't instant). The faint dark disc keeps the white spinner visible
          over light and dark posters alike. */}
      {started && !painted[activeIndex] && (
        <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm">
            <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </span>
        </div>
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
    </motion.div>
  );
}
