import type { InvitationData } from "./types";

/**
 * True when the invitation should render the tap-to-play video-sequence cover
 * instead of the standard envelope: explicitly enabled with at least one clip.
 * Any other case (disabled, no clips, unset) falls back to the envelope.
 */
export function shouldRenderVideoSequenceCover(
  coverVideos: InvitationData["coverVideos"],
): boolean {
  return Boolean(coverVideos?.enabled && coverVideos.items.length > 0);
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
