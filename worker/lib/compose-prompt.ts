/**
 * The per-turn prompt, assembled from the blocks each `*-brief.ts` produces.
 *
 * Extracted from `run-build.ts` because the ORDER is load-bearing and now
 * carries a cross-reference: `buildAttachmentBrief` tells the agent to follow
 * "the replication contract below", so the replication block must follow the
 * file list. The empty-string convention (a brief that does not apply returns
 * "") is honoured here — an inapplicable block contributes nothing at all, not
 * a blank gap.
 */
export interface BuildPromptParts {
  /** The invitation's real configuration. */
  brief: string;
  /** The saved source tree, on a resumed build. */
  manifest: string;
  /** Conversation recap, when the session was rotated or lost. */
  recap: string;
  attachmentBrief: string;
  replicationBrief: string;
  fontBrief: string;
  stockBrief: string;
  /** A block the admin selected in the preview. */
  elementBrief: string;
  /** The first-build plan pass. */
  planBrief: string;
  /** What the admin actually asked for, last so it is the freshest thing read. */
  prompt: string;
}

export function composeBuildPrompt(parts: BuildPromptParts): string {
  return [
    parts.brief,
    parts.manifest,
    parts.recap,
    parts.attachmentBrief,
    parts.replicationBrief,
    parts.fontBrief,
    parts.stockBrief,
    parts.elementBrief,
    parts.planBrief,
    parts.prompt,
  ]
    .filter((part) => part.trim() !== "")
    .join("\n\n");
}
