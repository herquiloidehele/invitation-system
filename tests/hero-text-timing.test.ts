import { describe, expect, it, vi } from "vitest";

import {
  advanceHeroTextPlaybackState,
  heroTextTimePartsToSeconds,
  heroTextTimingRangeError,
  initialHeroTextPlaybackState,
  normalizeHeroTextTimes,
  secondsToHeroTextTimeParts,
  subscribeToHeroTextVideoTime,
  type HeroTextVideoClock,
  type HeroTextVideoEvent,
} from "@/lib/hero-text-timing";

describe("normalizeHeroTextTimes", () => {
  it("preserves a valid start and optional later end", () => {
    expect(normalizeHeroTextTimes(65, 90)).toEqual({
      startSeconds: 65,
      endSeconds: 90,
    });
    expect(normalizeHeroTextTimes(65, undefined)).toEqual({
      startSeconds: 65,
    });
  });

  it("drops end-only and invalid starts", () => {
    expect(normalizeHeroTextTimes(undefined, 20)).toEqual({});
    expect(normalizeHeroTextTimes(-1, 20)).toEqual({});
    expect(normalizeHeroTextTimes(Number.NaN, 20)).toEqual({});
  });

  it("keeps a valid start but drops an end that is not later", () => {
    expect(normalizeHeroTextTimes(10, 10)).toEqual({ startSeconds: 10 });
    expect(normalizeHeroTextTimes(10, 9)).toEqual({ startSeconds: 10 });
    expect(normalizeHeroTextTimes(10, Number.POSITIVE_INFINITY)).toEqual({
      startSeconds: 10,
    });
  });
});

describe("hero text minute/second conversion", () => {
  it("converts whole minutes and seconds", () => {
    expect(secondsToHeroTextTimeParts(125)).toEqual({
      minutes: "2",
      seconds: "5",
    });
    expect(heroTextTimePartsToSeconds("2", "5")).toEqual({ value: 125 });
  });

  it("treats two blank fields as unset and one blank field as zero", () => {
    expect(heroTextTimePartsToSeconds("", "")).toEqual({ value: undefined });
    expect(heroTextTimePartsToSeconds("1", "")).toEqual({ value: 60 });
    expect(heroTextTimePartsToSeconds("", "5")).toEqual({ value: 5 });
  });

  it("rejects negative, fractional, non-numeric, and oversized seconds", () => {
    expect(heroTextTimePartsToSeconds("-1", "0").error).toBeTruthy();
    expect(heroTextTimePartsToSeconds("1.5", "0").error).toBeTruthy();
    expect(heroTextTimePartsToSeconds("x", "0").error).toBeTruthy();
    expect(heroTextTimePartsToSeconds("0", "60").error).toBeTruthy();
  });
});

describe("heroTextTimingRangeError", () => {
  it("requires a start before an end", () => {
    expect(heroTextTimingRangeError(undefined, 10)).toBe("start-required");
  });

  it("requires the end to be later than the start", () => {
    expect(heroTextTimingRangeError(10, 10)).toBe("end-not-after-start");
    expect(heroTextTimingRangeError(10, 9)).toBe("end-not-after-start");
  });

  it("accepts no end or a later end", () => {
    expect(heroTextTimingRangeError(undefined, undefined)).toBeUndefined();
    expect(heroTextTimingRangeError(10, undefined)).toBeUndefined();
    expect(heroTextTimingRangeError(10, 11)).toBeUndefined();
  });
});

describe("hero text playback state", () => {
  const startOnly = { startSeconds: 5 };
  const interval = { startSeconds: 5, endSeconds: 8 };

  it("starts untimed blocks visible and timed blocks waiting", () => {
    expect(initialHeroTextPlaybackState({})).toBe("visible");
    expect(initialHeroTextPlaybackState(startOnly)).toBe("waiting");
  });

  it("reveals at the exact start and keeps start-only text visible", () => {
    expect(advanceHeroTextPlaybackState(startOnly, "waiting", 4.99)).toBe(
      "waiting",
    );
    expect(advanceHeroTextPlaybackState(startOnly, "waiting", 5)).toBe(
      "visible",
    );
    expect(advanceHeroTextPlaybackState(startOnly, "visible", 0)).toBe(
      "visible",
    );
  });

  it("ends at the exact end and never reappears after rewind", () => {
    expect(advanceHeroTextPlaybackState(interval, "waiting", 5)).toBe(
      "visible",
    );
    expect(advanceHeroTextPlaybackState(interval, "visible", 8)).toBe(
      "ended",
    );
    expect(advanceHeroTextPlaybackState(interval, "ended", 0)).toBe("ended");
  });

  it("seeking past both thresholds goes directly to ended", () => {
    expect(advanceHeroTextPlaybackState(interval, "waiting", 9)).toBe(
      "ended",
    );
  });

  it("ignores invalid current times", () => {
    expect(advanceHeroTextPlaybackState(interval, "waiting", -1)).toBe(
      "waiting",
    );
    expect(
      advanceHeroTextPlaybackState(interval, "waiting", Number.NaN),
    ).toBe("waiting");
  });
});

class FakeVideoClock implements HeroTextVideoClock {
  currentTime = 2;
  readonly listeners = new Map<HeroTextVideoEvent, Set<() => void>>();

  addEventListener(event: HeroTextVideoEvent, listener: () => void) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  removeEventListener(event: HeroTextVideoEvent, listener: () => void) {
    this.listeners.get(event)?.delete(listener);
  }

  fire(event: HeroTextVideoEvent, currentTime: number) {
    this.currentTime = currentTime;
    for (const listener of this.listeners.get(event) ?? []) listener();
  }
}

describe("subscribeToHeroTextVideoTime", () => {
  it("reports immediately, follows playback events, and removes listeners", () => {
    const video = new FakeVideoClock();
    const listener = vi.fn();

    const unsubscribe = subscribeToHeroTextVideoTime(video, listener);

    expect(listener).toHaveBeenLastCalledWith(2);
    for (const event of [
      "timeupdate",
      "seeking",
      "loadedmetadata",
      "play",
    ] as const) {
      video.fire(event, video.currentTime + 1);
    }
    expect(listener).toHaveBeenCalledTimes(5);
    expect(listener).toHaveBeenLastCalledWith(6);

    unsubscribe();
    video.fire("timeupdate", 7);
    expect(listener).toHaveBeenCalledTimes(5);
    for (const listeners of video.listeners.values()) {
      expect(listeners.size).toBe(0);
    }
  });
});
