"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import type { CoverVideoItem } from "@/lib/types";
import { nextCoverStep } from "@/lib/cover-videos";

interface VideoSequenceCoverProps {
  /** Ordered clips (1–4). */
  items: CoverVideoItem[];
  /** Fired on the tap-to-begin gesture (parent upgrades hero prefetch). */
  onOpen: () => void;
  /** Fired after the last clip (or a mid-sequence failure) → parent reveals the invitation. */
  onAnimationComplete: () => void;
  /**
   * Fired when the first clip fails to load *before* playback starts, so the
   * parent can fall back to the standard envelope cover.
   */
  onUnavailable?: () => void;
}

/** Seconds of overlap for the crossfade between consecutive clips. */
const CROSSFADE_SEC = 0.5;

/**
 * Tap-to-play cover that plays a sequence of videos with a crossfade between
 * them, then hands off to the invitation page. On tap, every remaining clip
 * starts buffering in parallel so each is ready by its turn and the crossfades
 * never stall; already-played clips unmount and are reclaimed. Before the tap
 * only the first clip loads its metadata, so guests who never open the
 * invitation don't download the whole sequence.
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
  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const failedRef = useRef<Set<number>>(new Set());
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const total = items.length;

  const handoff = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onAnimationComplete();
  }, [onAnimationComplete]);

  const handleTap = useCallback(() => {
    if (startedRef.current) return; // idempotent against rapid double-taps
    startedRef.current = true;
    setStarted(true);
    onOpen();
    // Within the user gesture: unmute + play clip 1 (autoplay-with-sound is
    // allowed here), and warm clip 2 so the first crossfade is ready.
    const first = videoRefs.current[0];
    if (first) {
      first.muted = false;
      first.preload = "auto";
      first.play().catch(() => {});
    }
    const next = videoRefs.current[1];
    if (next) next.preload = "auto";
  }, [onOpen]);

  /** Begin overlapping the current clip with the next as it nears its end. */
  const handleTimeUpdate = useCallback(
    (index: number) => {
      if (index !== activeIndex || crossfading) return;
      if (index >= total - 1) return; // last clip: wait for onEnded → handoff
      if (failedRef.current.has(index + 1)) return; // next clip is broken → no crossfade
      const el = videoRefs.current[index];
      // Skip the crossfade when the duration is unknown or shorter than the
      // crossfade window (would otherwise fire the fade at t≈0); the clip then
      // hard-cuts to the next on its natural end.
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
          next.play().catch(() => {});
        }
      }
    },
    [activeIndex, crossfading, total],
  );

  /** A clip reached its natural end: advance to the next or hand off. */
  const handleEnded = useCallback(
    (index: number) => {
      if (index !== activeIndex) return;
      const step = nextCoverStep(index, total);
      // Hand off after the last clip, or if the next clip failed to load.
      if (step.kind === "handoff" || failedRef.current.has(step.index)) {
        handoff();
        return;
      }
      setCrossfading(false);
      setActiveIndex(step.index);
    },
    [activeIndex, total, handoff],
  );

  const handleError = useCallback(
    (index: number) => {
      failedRef.current.add(index);
      // Pre-start failure of the first clip → fall back to the envelope.
      if (!started && index === 0) {
        onUnavailable?.();
        return;
      }
      // The active clip failed mid-sequence → skip straight to the invitation.
      // A non-active (preloading/next) clip failing is recorded above and
      // handled by handleEnded, which hands off instead of advancing to it.
      if (started && index === activeIndex) {
        handoff();
      }
    },
    [started, activeIndex, onUnavailable, handoff],
  );

  // Degenerate guard: an empty sequence hands off immediately.
  useEffect(() => {
    if (total === 0) handoff();
  }, [total, handoff]);

  // Ensure the active clip is actually playing. Covers the case where a
  // crossfade's pre-play() was blocked by autoplay policy: without this the
  // sequence could stall on a visible-but-paused clip (no timeupdate/ended
  // would ever fire again).
  useEffect(() => {
    if (!started) return;
    const el = videoRefs.current[activeIndex];
    if (el && el.paused) el.play().catch(() => {});
  }, [started, activeIndex]);

  // Render only the active clip and the next one (preloading).
  const visibleIndices = [activeIndex, activeIndex + 1].filter(
    (i) => i >= 0 && i < total,
  );

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
      {visibleIndices.map((i) => {
        const isActive = i === activeIndex;
        const opacity = crossfading ? (isActive ? 0 : 1) : isActive ? 1 : 0;
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
              src={items[i].url}
              // Poster is only meaningful for the pre-tap first clip; the
              // preloading "next" clip is invisible, so don't fetch its poster.
              poster={!started && i === 0 ? items[i].poster : undefined}
              muted={!started}
              playsInline
              preload={!started ? (i === 0 ? "metadata" : "none") : "auto"}
              className="h-full w-full object-cover"
              onTimeUpdate={() => handleTimeUpdate(i)}
              onEnded={() => handleEnded(i)}
              onError={() => handleError(i)}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
