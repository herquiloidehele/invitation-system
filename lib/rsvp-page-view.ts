export type RsvpSubmitState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "already_submitted";

/** Panel the admin preview is pinned to. */
export type RsvpPagePreviewState = "form" | "success" | "already" | "closed";

export type RsvpPageView =
  | "closed"
  | "deadline"
  | "already"
  | "success"
  | "error"
  | "form";

/**
 * Which panel the RSVP page shows. The live page lets host-closed beat the
 * deadline, and both beat the guest's own submission state. The admin
 * preview shows whatever state the admin picked.
 */
export function resolveRsvpPageView({
  closed,
  deadlinePassed,
  submitState,
  previewState,
}: {
  closed: boolean;
  deadlinePassed: boolean;
  submitState: RsvpSubmitState;
  previewState?: RsvpPagePreviewState;
}): RsvpPageView {
  if (previewState) {
    if (previewState === "closed") return "closed";
    if (previewState === "already") return "already";
    if (previewState === "success" || submitState === "success") {
      return "success";
    }
    return "form";
  }
  if (closed) return "closed";
  if (deadlinePassed) return "deadline";
  if (submitState === "already_submitted") return "already";
  if (submitState === "success") return "success";
  if (submitState === "error") return "error";
  return "form";
}
