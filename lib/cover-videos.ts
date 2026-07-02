import type { CoverVideoItem, InvitationData } from "./types";

/**
 * True when a value is a usable cover clip — an object with a non-empty string
 * `url`. Guards against malformed persisted JSON (the admin API stores
 * `coverVideos` without shape validation), which must never crash rendering.
 */
export function isValidCoverVideoItem(item: unknown): item is CoverVideoItem {
  return Boolean(
    item &&
      typeof item === "object" &&
      typeof (item as CoverVideoItem).url === "string" &&
      (item as CoverVideoItem).url.length > 0,
  );
}

/**
 * True when the invitation should render the tap-to-play video-sequence cover
 * instead of the standard envelope: explicitly enabled with at least one valid
 * clip. Any other case (disabled, no/malformed clips, unset) falls back to the
 * envelope — and never throws on malformed data.
 */
export function shouldRenderVideoSequenceCover(
  coverVideos: InvitationData["coverVideos"],
): boolean {
  return Boolean(
    coverVideos?.enabled &&
      Array.isArray(coverVideos.items) &&
      coverVideos.items.some(isValidCoverVideoItem),
  );
}

/** What the cover should do after a clip finishes. */
export type CoverStep =
  | { kind: "play"; index: number }
  | { kind: "handoff" };

/**
 * Given the index of the clip that just finished and the total number of clips,
 * decide whether to play the next clip or hand off to the invitation page.
 */
export function nextCoverStep(finishedIndex: number, total: number): CoverStep {
  if (finishedIndex < total - 1) {
    return { kind: "play", index: finishedIndex + 1 };
  }
  return { kind: "handoff" };
}
