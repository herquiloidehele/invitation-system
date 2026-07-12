"use client";

import { type RefObject, useEffect, useState } from "react";

import { watchForPresentedVideoFrame } from "@/lib/video-frame";

export function useVideoFrameReady(
  videoRef: RefObject<HTMLVideoElement | null>,
  resetKey: string,
): boolean {
  const [readyFrame, setReadyFrame] = useState({
    key: resetKey,
    ready: false,
  });
  const ready = readyFrame.key === resetKey && readyFrame.ready;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    return watchForPresentedVideoFrame(video, () =>
      setReadyFrame({ key: resetKey, ready: true }),
    );
  }, [videoRef, resetKey]);

  return ready;
}
