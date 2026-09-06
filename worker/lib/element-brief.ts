import type { SelectedElementDescriptor } from "@/lib/ai-preview-select";
import { attachmentPath } from "./attachment-brief";

/** Filename of the crop inside the workspace `refs/` dir. */
export const SELECTION_IMAGE_NAME = "selection.png";

/**
 * The prompt block describing the one block the user pointed at in the preview.
 * The agent should scope its next edit to this block, not restyle the page.
 */
export function buildElementBrief(
  descriptor: SelectedElementDescriptor,
  hasImage: boolean,
): string {
  const where = descriptor.nearestHeading
    ? `in the section under "${descriptor.nearestHeading}"`
    : `near the ${descriptor.position} of the page`;
  const text = descriptor.text ? ` reading "${descriptor.text}"` : "";

  const lines = [
    "The user pointed at ONE specific block in the live preview and wants their",
    "next request applied to THAT block, not the whole page.",
    `The block is a <${descriptor.tag}>${text}, ${where} ` +
      `(${descriptor.position} of the page).`,
  ];
  if (hasImage) {
    lines.push(
      `A cropped screenshot of exactly that block is at ${attachmentPath(
        SELECTION_IMAGE_NAME,
      )} — open it to see what they mean.`,
    );
  }
  lines.push(
    "Find the matching element in the source by its text and position, and scope",
    "your edit to it. Do not restyle unrelated parts of the page.",
  );
  return lines.join("\n");
}
