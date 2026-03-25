"use client";

/* ------------------------------------------------------------------ */
/*  ExternalVideoPage                                                   */
/*                                                                      */
/*  Full-screen autoplay video — no controls, no chrome.               */
/*  The video fills the entire viewport, object-fit: cover.            */
/*                                                                      */
/*  Usage: mount this component early (hidden) and call the returned   */
/*  `play()` handle imperatively from the gesture handler so the       */
/*  browser autoplay policy is satisfied.                              */
/* ------------------------------------------------------------------ */

import { useRef, useImperativeHandle, forwardRef } from "react";

export interface ExternalVideoPageHandle {
  play: () => void;
}

interface ExternalVideoPageProps {
  videoUrl: string;
  /** When false the wrapper is invisible but still mounted (preloading). */
  visible?: boolean;
}

const ExternalVideoPage = forwardRef<
  ExternalVideoPageHandle,
  ExternalVideoPageProps
>(function ExternalVideoPage({ videoUrl, visible = true }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useImperativeHandle(ref, () => ({
    play() {
      const v = videoRef.current;
      if (!v) return;
      v.play().catch(() => {
        // If unmuted autoplay is blocked, fall back to muted autoplay
        v.muted = true;
        v.play().catch(() => {});
      });
    },
  }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        zIndex: 50,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.8s ease",
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
});

export default ExternalVideoPage;
