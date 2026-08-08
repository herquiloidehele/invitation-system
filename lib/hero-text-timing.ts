import type { HeroTextBlock } from "./types";

export type HeroTextPlaybackState = "waiting" | "visible" | "ended";

export type HeroTextVideoEvent =
  | "timeupdate"
  | "seeking"
  | "loadedmetadata"
  | "play";

export interface HeroTextVideoClock {
  currentTime: number;
  addEventListener(event: HeroTextVideoEvent, listener: () => void): void;
  removeEventListener(event: HeroTextVideoEvent, listener: () => void): void;
}

export interface HeroTextTimeParts {
  minutes: string;
  seconds: string;
}

export interface ParsedHeroTextTime {
  value?: number;
  error?: "invalid-minutes" | "invalid-seconds";
}

export type HeroTextTimingRangeError =
  | "start-required"
  | "end-not-after-start";

function validTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeHeroTextTimes(
  start: unknown,
  end: unknown,
): Pick<HeroTextBlock, "startSeconds" | "endSeconds"> {
  if (!validTime(start)) return {};
  if (!validTime(end) || end <= start) return { startSeconds: start };
  return { startSeconds: start, endSeconds: end };
}

export function secondsToHeroTextTimeParts(
  value?: number,
): HeroTextTimeParts {
  if (!validTime(value)) return { minutes: "", seconds: "" };
  const wholeSeconds = Math.floor(value);
  return {
    minutes: String(Math.floor(wholeSeconds / 60)),
    seconds: String(wholeSeconds % 60),
  };
}

function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function heroTextTimePartsToSeconds(
  minutes: string,
  seconds: string,
): ParsedHeroTextTime {
  const minutesValue = minutes.trim();
  const secondsValue = seconds.trim();
  if (!minutesValue && !secondsValue) return { value: undefined };

  const parsedMinutes = minutesValue ? parseWholeNumber(minutesValue) : 0;
  if (parsedMinutes === null) return { error: "invalid-minutes" };

  const parsedSeconds = secondsValue ? parseWholeNumber(secondsValue) : 0;
  if (parsedSeconds === null || parsedSeconds > 59) {
    return { error: "invalid-seconds" };
  }

  return { value: parsedMinutes * 60 + parsedSeconds };
}

export function heroTextTimingRangeError(
  startSeconds?: number,
  endSeconds?: number,
): HeroTextTimingRangeError | undefined {
  if (endSeconds === undefined) return undefined;
  if (startSeconds === undefined) return "start-required";
  return endSeconds > startSeconds ? undefined : "end-not-after-start";
}

export function initialHeroTextPlaybackState(
  block: Pick<HeroTextBlock, "startSeconds">,
): HeroTextPlaybackState {
  return validTime(block.startSeconds) ? "waiting" : "visible";
}

export function advanceHeroTextPlaybackState(
  block: Pick<HeroTextBlock, "startSeconds" | "endSeconds">,
  previous: HeroTextPlaybackState,
  currentTime: number,
): HeroTextPlaybackState {
  if (previous === "ended" || !validTime(currentTime)) return previous;
  if (!validTime(block.startSeconds)) return "visible";
  if (validTime(block.endSeconds) && currentTime >= block.endSeconds) {
    return "ended";
  }
  if (previous === "visible" || currentTime >= block.startSeconds) {
    return "visible";
  }
  return "waiting";
}

const VIDEO_EVENTS: HeroTextVideoEvent[] = [
  "timeupdate",
  "seeking",
  "loadedmetadata",
  "play",
];

export function subscribeToHeroTextVideoTime(
  video: HeroTextVideoClock,
  listener: (currentTime: number) => void,
): () => void {
  const report = () => listener(video.currentTime);
  for (const event of VIDEO_EVENTS) video.addEventListener(event, report);
  report();
  return () => {
    for (const event of VIDEO_EVENTS) video.removeEventListener(event, report);
  };
}
