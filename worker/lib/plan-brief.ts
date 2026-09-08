/**
 * The first-build instruction that forces a written design plan before any code.
 *
 * This lives in the PER-TURN prompt, never in the system prompt. A critique turn
 * resumes the first build's session and tweaks run their own cache, so the
 * system prompt must stay byte-identical across every turn — varying it by turn
 * type would split the cache and re-upload the whole prefix.
 *
 * Returns "" for a non-first build, matching the `*-brief.ts` convention where
 * an empty string contributes nothing to the composed prompt.
 */
export function buildPlanBrief(isFirstBuild: boolean): string {
  if (!isFirstBuild) return "";
  return [
    "This is the first build — the design is decided now. Before you write any",
    ".tsx file:",
    "",
    '1. Load the "design-process" skill and follow it.',
    "2. Write PLAN.md in the workspace root: colour, type, the layout wireframe,",
    "   principles, and the self-review paragraph.",
    "3. Only then write the code, following the plan you just reviewed.",
    "",
    'Load the "phone-craft" skill before you build the cover or the RSVP section.',
    "",
    "PLAN.md is part of the deliverable and is saved with this revision.",
    "Do not delete it when you are done.",
  ].join("\n");
}
