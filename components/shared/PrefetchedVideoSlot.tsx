"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { ObjectFit } from "@/lib/types";
import VideoPosterLayer from "./VideoPosterLayer";
import { useVideoFrameReady } from "./useVideoFrameReady";

export function applyPrefetchedHeroVideoMuted(
  video: HTMLVideoElement,
  muted: boolean,
) {
  video.muted = muted;
}

// ---------------------------------------------------------------------------
// PrefetchedVideoSlot — adopts an already-buffered <video> DOM element into
// the hero section so the browser reuses the same element (avoiding a
// duplicate network download).
// ---------------------------------------------------------------------------

export function PrefetchedVideoSlot({
  videoRef,
  posterUrl,
  mediaFit = "cover",
  muted,
  autoPlay = true,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  posterUrl?: string;
  mediaFit?: ObjectFit;
  muted: boolean;
  /**
   * Whether the hero is actually on screen. False while a cover still covers
   * it: playing a video the guest cannot see makes the browser download it at
   * full speed, starving the cover clip they ARE waiting to tap — and burns
   * mobile data for guests who never open the invitation at all. `preload`
   * alone can't prevent this; playback overrides the hint.
   */
  autoPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoReady = useVideoFrameReady(videoRef, posterUrl ?? "");

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Re-style the video for hero display
    video.className = "absolute inset-0 h-full w-full";
    video.style.objectFit = mediaFit;
    video.style.position = "";
    video.style.width = "";
    video.style.height = "";
    video.style.opacity = "";
    video.style.pointerEvents = "";
    video.removeAttribute("aria-hidden");
    video.autoplay = autoPlay;
    video.poster = posterUrl ?? "";
    applyPrefetchedHeroVideoMuted(video, muted);
    video.dataset.invitationVideo = "";

    // Move the existing DOM node into this container
    container.appendChild(video);
    // Starts when `autoPlay` flips true (the cover handing off re-runs this).
    if (autoPlay) video.play().catch(() => {});
  }, [videoRef, mediaFit, muted, posterUrl, autoPlay]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full">
      <VideoPosterLayer
        posterUrl={posterUrl}
        visible={!videoReady}
        mediaFit={mediaFit}
        zIndex={1}
      />
    </div>
  );
}
