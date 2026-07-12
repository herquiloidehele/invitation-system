"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { ObjectFit } from "@/lib/types";
import VideoPosterLayer from "./VideoPosterLayer";
import { useVideoFrameReady } from "./useVideoFrameReady";

// ---------------------------------------------------------------------------
// PrefetchedVideoSlot — adopts an already-buffered <video> DOM element into
// the hero section so the browser reuses the same element (avoiding a
// duplicate network download).
// ---------------------------------------------------------------------------

export function PrefetchedVideoSlot({
  videoRef,
  posterUrl,
  mediaFit = "cover",
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  posterUrl?: string;
  mediaFit?: ObjectFit;
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
    video.autoplay = true;
    video.poster = posterUrl ?? "";
    video.dataset.invitationVideo = "";

    // Move the existing DOM node into this container
    container.appendChild(video);
    video.play().catch(() => {});
  }, [videoRef, mediaFit, posterUrl]);

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
