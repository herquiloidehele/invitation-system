export interface VideoFrameTarget {
  currentTime: number;
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
  addEventListener(type: "timeupdate", listener: () => void): void;
  removeEventListener(type: "timeupdate", listener: () => void): void;
}

/**
 * Calls `onFrame` once the browser presents a decoded frame. The timeupdate
 * listener is retained as a fallback for browsers without rVFC support.
 */
export function watchForPresentedVideoFrame(
  video: VideoFrameTarget,
  onFrame: () => void,
): () => void {
  let finished = false;
  let frameHandle: number | undefined;

  const handleTimeUpdate = () => {
    if (video.currentTime > 0) finish();
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    video.removeEventListener("timeupdate", handleTimeUpdate);
    onFrame();
  };

  video.addEventListener("timeupdate", handleTimeUpdate);
  if (video.requestVideoFrameCallback) {
    frameHandle = video.requestVideoFrameCallback(finish);
  }

  return () => {
    if (finished) return;
    finished = true;
    video.removeEventListener("timeupdate", handleTimeUpdate);
    if (frameHandle !== undefined) {
      video.cancelVideoFrameCallback?.(frameHandle);
    }
  };
}
