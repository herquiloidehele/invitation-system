import type { Direction } from "./directions";

/** A compact event surfaced to the admin UI (a subset of the SDK's message stream). */
export type BuildEvent =
  | { kind: "progress"; text: string }
  | { kind: "delta"; text: string }
  | { kind: "tool"; name: string; label: string }
  | { kind: "result"; ok: boolean; costUsd: number | null }
  | { kind: "directions"; directions: Direction[] }
  | { kind: "question"; text: string }
  | { kind: "draft"; revisionId: string; slug: string }
  | { kind: "error"; message: string; hint?: string; detail?: string };

/** Just the file name — the workspace path is noise in the admin UI. */
function baseName(filePath: unknown): string | null {
  if (typeof filePath !== "string" || !filePath) return null;
  return filePath.split("/").filter(Boolean).pop() ?? null;
}

/**
 * A human description of what the agent is doing, in the admin's language
 * (pt-PT), rather than a bare tool name. "A editar index.tsx" tells the
 * designer something; "Edit" does not.
 */
export function toolLabel(name: string, input?: unknown): string {
  const args = (input ?? {}) as { file_path?: unknown; command?: unknown };
  const file = baseName(args.file_path);

  switch (name) {
    case "Read":
      return file ? `A ler ${file}` : "A ler ficheiro";
    case "Edit":
      return file ? `A editar ${file}` : "A editar ficheiro";
    case "Write":
      return file ? `A escrever ${file}` : "A escrever ficheiro";
    case "Grep":
      return "A procurar no código";
    case "Glob":
      return "A procurar ficheiros";
    case "Bash": {
      const cmd = typeof args.command === "string" ? args.command : "";
      if (/\bnpm run build\b/.test(cmd)) return "A compilar o bundle";
      if (/\btsc\b/.test(cmd)) return "A verificar tipos";
      if (/\besbuild\b|build\.mjs/.test(cmd)) return "A gerar o bundle";
      return "A executar comando";
    }
    default:
      return name;
  }
}

/** Map a raw Agent SDK message to a compact BuildEvent, or null to drop it. */
export function toBuildEvent(message: unknown): BuildEvent | null {
  const m = message as {
    type?: string;
    subtype?: string;
    total_cost_usd?: number;
    event?: {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    message?: {
      content?: Array<{
        type?: string;
        text?: string;
        name?: string;
        input?: unknown;
      }>;
    };
  };

  // Incremental text while the assistant is still writing. Emitted only when
  // `includePartialMessages` is on; the complete assistant message still
  // follows and seals the bubble.
  if (m.type === "stream_event") {
    if (
      m.event?.type === "content_block_delta" &&
      m.event.delta?.type === "text_delta" &&
      typeof m.event.delta.text === "string" &&
      m.event.delta.text.length > 0
    ) {
      return { kind: "delta", text: m.event.delta.text };
    }
    return null;
  }

  if (m.type === "assistant" && Array.isArray(m.message?.content)) {
    for (const block of m.message!.content) {
      if (block.type === "text" && block.text?.trim()) {
        return { kind: "progress", text: block.text.trim() };
      }
      if (block.type === "tool_use" && block.name) {
        return {
          kind: "tool",
          name: block.name,
          label: toolLabel(block.name, block.input),
        };
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
