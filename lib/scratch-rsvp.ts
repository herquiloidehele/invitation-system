import type { InvitationData } from "./types";

export type ScratchDatePart = "day" | "month" | "year";

const SCRATCH_DATE_PART_COUNT = 3;

export function registerRevealedScratchPart(
  revealed: ReadonlySet<ScratchDatePart>,
  part: ScratchDatePart,
): { parts: Set<ScratchDatePart>; complete: boolean } {
  const parts = new Set(revealed);
  parts.add(part);

  return {
    parts,
    complete: parts.size === SCRATCH_DATE_PART_COUNT,
  };
}

export function shouldEnablePostScratchRsvp(
  invitation: Pick<InvitationData, "scratchReveal" | "rsvp">,
): boolean {
  return (
    invitation.scratchReveal?.showRsvpButtonAfterReveal === true &&
    invitation.rsvp.enabled === true
  );
}

export function shouldShowInlineRsvp({
  inlineEligible,
  postScratchRsvpEnabled,
}: {
  inlineEligible: boolean;
  postScratchRsvpEnabled: boolean;
}): boolean {
  return inlineEligible && !postScratchRsvpEnabled;
}
