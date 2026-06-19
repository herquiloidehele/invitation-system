"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { ObjectFit } from "@/lib/types";

// ---------------------------------------------------------------------------
// PrefetchedVideoSlot — adopts an already-buffered <video> DOM element into
// the hero section so the browser reuses the same element (avoiding a
// duplicate network download).
// ---------------------------------------------------------------------------

export function PrefetchedVideoSlot({
  videoRef,
  mediaFit = "cover",
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  mediaFit?: ObjectFit;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    video.dataset.invitationVideo = "";

    // Move the existing DOM node into this container
    container.appendChild(video);
    video.play().catch(() => {});
  }, [videoRef, mediaFit]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
