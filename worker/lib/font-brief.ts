import { buildFontDisplayStack } from "@/lib/custom-fonts/domain";
import type { FontCategory } from "@/lib/custom-fonts/types";

import type { FontAssetRecord } from "../persistence";

/**
 * The prompt block describing fonts the admin uploaded for this invitation.
 *
 * Uploaded fonts are real `CustomFontFamily` rows; the runtime `<Font>` /
 * `useDynamicFont` machinery loads them and registers each `@font-face` under
 * BOTH the `custom-font-<id>` identity and the human name. So the load tag
 * carries the id (that string lives only in index.tsx), while the CSS the agent
 * writes uses the readable name — which is what shows up in computed styles.
 */
export function buildFontBrief(fonts: FontAssetRecord[]): string {
  if (fonts.length === 0) return "";

  const lines = fonts.map((f) => {
    const stack = buildFontDisplayStack(f.family, f.category as FontCategory);
    return `- "${f.family}" (${f.category}) — load once with: <Font family="${f.cssFamily}" /> · use in your CSS/theme: ${stack}`;
  });

  return [
    "Uploaded fonts (custom, provided for THIS invitation):",
    ...lines,
    "",
    "Apply the uploaded font as the invitation's PRIMARY typeface — the couple",
    "names, headings and display text — unless the conversation asks otherwise.",
    "When more than one is uploaded, use the first for display and the next for",
    "body.",
    "",
    "How to use one:",
    "- Load it once in index.tsx with the exact <Font ... /> tag shown above.",
    "  That tag is the ONLY place the custom-font-<id> string appears — it tells",
    "  the host which font to fetch.",
    "- Everywhere else — theme.ts tokens and your sections' CSS — use the readable",
    "  stack shown above (the human family name, e.g. 'Cormorant Display', serif).",
    "  NEVER put the custom-font-<id> string in a theme token or element style.",
    "",
    "Do NOT use a Google or builtin font for headings when an uploaded font is",
    "present. Do not declare @font-face yourself — the host injects it.",
  ].join("\n");
}
