import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  type VideoFrameTarget,
  watchForPresentedVideoFrame,
} from "@/lib/video-frame";

type FakeTarget = VideoFrameTarget & {
  fireFrame: () => void;
  fireTimeUpdate: (currentTime: number) => void;
};

function makeTarget({ frameCallback = true } = {}): FakeTarget {
  let frameHandler: (() => void) | undefined;
  let timeUpdateHandler: (() => void) | undefined;
  const target: FakeTarget = {
    currentTime: 0,
    requestVideoFrameCallback(callback) {
      frameHandler = callback;
      return 7;
    },
    cancelVideoFrameCallback() {
      frameHandler = undefined;
    },
    addEventListener(_type, listener) {
      timeUpdateHandler = listener;
    },
    removeEventListener(_type, listener) {
      if (timeUpdateHandler === listener) timeUpdateHandler = undefined;
    },
    fireFrame() {
      frameHandler?.();
    },
    fireTimeUpdate(currentTime) {
      target.currentTime = currentTime;
      timeUpdateHandler?.();
    },
  };

  if (!frameCallback) {
    delete target.requestVideoFrameCallback;
    delete target.cancelVideoFrameCallback;
  }
  return target;
}

describe("watchForPresentedVideoFrame", () => {
  it("reports the requestVideoFrameCallback frame once", () => {
    const target = makeTarget();
    const onFrame = vi.fn();
    const cleanup = watchForPresentedVideoFrame(target, onFrame);

    target.fireFrame();
    target.fireTimeUpdate(1);

    expect(onFrame).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("falls back to a progressing timeupdate", () => {
    const target = makeTarget({ frameCallback: false });
    const onFrame = vi.fn();
    watchForPresentedVideoFrame(target, onFrame);

    target.fireTimeUpdate(0);
    expect(onFrame).not.toHaveBeenCalled();
    target.fireTimeUpdate(0.01);
    expect(onFrame).toHaveBeenCalledOnce();
  });

  it("cancels callbacks and listeners during cleanup", () => {
    const target = makeTarget();
    const onFrame = vi.fn();
    const cleanup = watchForPresentedVideoFrame(target, onFrame);

    cleanup();
    target.fireFrame();
    target.fireTimeUpdate(1);

    expect(onFrame).not.toHaveBeenCalled();
  });

  it("resets readiness by key without setting state synchronously in an effect", () => {
    const hook = readFileSync(
      "components/shared/useVideoFrameReady.ts",
      "utf8",
    );

    expect(hook).not.toContain("setReady(false)");
    expect(hook).toContain("readyFrame.key === resetKey");
  });
});
