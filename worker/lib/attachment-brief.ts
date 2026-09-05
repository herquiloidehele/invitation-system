import type { AttachmentRecord } from "../persistence";

/** Local path inside the workspace where an attachment is materialised. */
export function attachmentPath(name: string): string {
  return `refs/${name}`;
}

/**
 * The prompt block describing uploaded files.
 *
 * There is deliberately no per-file "reference or asset" flag — the agent
 * decides from the conversation, and asks when it genuinely cannot tell. So the
 * brief must state that rule, point at `props.assets.library` as the only
 * legitimate way to render one, and name the sentinel used to ask.
 */
export function buildAttachmentBrief(files: AttachmentRecord[]): string {
  if (files.length === 0) return "";

  const lines = files.map(
    (f) =>
      `- id "${f.id}" · ${f.name} · ${f.kind} · local copy: ${attachmentPath(
        f.name,
      )} · url: ${f.url}`,
  );

  return [
    "Attached files:",
    ...lines,
    "",
    "Open the local copies to look at them. Then decide, from what the",
    "conversation asks for, what each file is for:",
    "- Style reference — take cues (palette, mood, type, composition) and do",
    "  NOT put the file in the invitation.",
    "- Content to display — render it via props.assets.library (match on id or",
    "  name) inside <Media>. Never hardcode the url in the source.",
    'Files with kind "pdf" are ALWAYS reference only — never render them, and',
    "never ask about them.",
    "",
    "If you genuinely cannot tell what an image is for, do NOT guess and do NOT",
    "write any code. Write your question (in the language of the conversation)",
    "to NEEDS_INPUT.md in the workspace root, then stop. Ask only about images,",
    "only when the conversation is truly ambiguous, and keep it to one short",
    "question.",
  ].join("\n");
}
