import type { Direction } from "./directions";

/** A compact event surfaced to the admin UI (a subset of the SDK's message stream). */
export type BuildEvent =
  | { kind: "progress"; text: string }
  | { kind: "tool"; name: string }
  | { kind: "result"; ok: boolean; costUsd: number | null }
  | { kind: "directions"; directions: Direction[] }
  | { kind: "draft"; revisionId: string; slug: string }
  | { kind: "error"; message: string };

/** Map a raw Agent SDK message to a compact BuildEvent, or null to drop it. */
export function toBuildEvent(message: unknown): BuildEvent | null {
  const m = message as {
    type?: string;
    subtype?: string;
    total_cost_usd?: number;
    message?: {
      content?: Array<{ type?: string; text?: string; name?: string }>;
    };
  };

  if (m.type === "assistant" && Array.isArray(m.message?.content)) {
    for (const block of m.message!.content) {
      if (block.type === "text" && block.text?.trim()) {
        return { kind: "progress", text: block.text.trim() };
      }
      if (block.type === "tool_use" && block.name) {
        return { kind: "tool", name: block.name };
      }
    }
    return null;
  }
  if (m.type === "result") {
    return {
      kind: "result",
      ok: m.subtype === "success",
      costUsd: typeof m.total_cost_usd === "number" ? m.total_cost_usd : null,
    };
  }
  return null;
}
