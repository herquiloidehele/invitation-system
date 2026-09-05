/** How an invitation's body is rendered. */
export type InvitationRenderMode = "standard" | "ai";

const RENDER_MODES: readonly InvitationRenderMode[] = ["standard", "ai"];

/**
 * Coerce a persisted render mode into a known value. Rows created before the
 * column existed, and any malformed value, render the standard invitation —
 * an unknown mode must never blank the page.
 */
export function normalizeRenderMode(value: unknown): InvitationRenderMode {
  return RENDER_MODES.includes(value as InvitationRenderMode)
    ? (value as InvitationRenderMode)
    : "standard";
}

/**
 * True when the invitation should render a generated bundle. Requires a bundle
 * URL: an `ai` invitation with no published revision falls back to the standard
 * renderer rather than rendering nothing.
 */
export function isAiRenderMode(invitation: {
  renderMode?: InvitationRenderMode | null;
  aiBundleUrl?: string | null;
}): boolean {
  return (
    normalizeRenderMode(invitation.renderMode) === "ai" &&
    typeof invitation.aiBundleUrl === "string" &&
    invitation.aiBundleUrl.length > 0
  );
}
