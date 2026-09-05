import path from "node:path";

import { query } from "@anthropic-ai/claude-agent-sdk";

import { platformContract } from "./lib/skill";
import { artDirection } from "./lib/art-direction";

export interface BuildAgentResult {
  messages: unknown[];
  costUsd: number | null;
  sessionId: string | null;
}

/**
 * The agent's system prompt, with the `@platform` contract inlined.
 *
 * The contract used to live only in `.claude/skills/platform/SKILL.md`, which
 * cost a full round-trip on every run just to re-orient. Inlining it here is
 * ~6KB in the stable, cacheable prefix and removes that turn entirely.
 */
export function buildSystemPrompt(dtsContent: string): string {
  return `You are an expert frontend designer building a single, self-contained wedding-invitation component.

You are working inside a workspace. Write the component following the File layout in the contract below (index.tsx + theme.ts + sections/*.tsx). Import only from react, framer-motion, and @platform. Run \`npm run build\` ONCE, when you believe you are done. If it fails, fix the reported errors and run it again. Do not run it after every edit, and do not run tsc separately — the build already does.

The design must be distinctive and production-grade — never generic. When you are done and the build passes, stop.

${artDirection()}

The full @platform contract you must build against follows. It is authoritative; you do not need to look it up anywhere else.

${platformContract(dtsContent)}`;
}

/**
 * Run the builder agent in `workspaceDir` for one prompt. Returns the collected
 * messages and cost. `bundleId` is exported into the build via BUNDLE_ID.
 *
 * The workspace has no node_modules of its own, so the agent's env gets the
 * repo's `node_modules/.bin` on PATH (for `tsc`) and NODE_PATH pointing at the
 * repo's `node_modules` (so the workspace's `build.mjs` resolves `esbuild`).
 */
export async function runBuildAgent(args: {
  workspaceDir: string;
  prompt: string;
  bundleId: string;
  /** The `@platform` .d.ts, inlined into the system prompt. */
  dts: string;
  model?: string;
  maxBudgetUsd?: number;
  maxTurns?: number;
  /** Thinking depth. Design turns deserve `high`; mechanical edits do not. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  resume?: string;
  onMessage?: (message: unknown) => void;
}): Promise<BuildAgentResult> {
  const repoRoot = process.cwd();
  const repoBin = path.join(repoRoot, "node_modules", ".bin");
  const repoModules = path.join(repoRoot, "node_modules");

  const messages: unknown[] = [];
  let costUsd: number | null = null;
  let sessionId: string | null = null;

  const q = query({
    prompt: args.prompt,
    options: {
      cwd: args.workspaceDir,
      systemPrompt: buildSystemPrompt(args.dts),
      settingSources: ["project"],
      // Stream the assistant's prose token-by-token into the admin chat. The
      // complete assistant message still arrives afterwards and seals the
      // bubble, so the final text is always authoritative.
      includePartialMessages: true,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      disallowedTools: [
        "Bash(rm -rf /*)",
        "Bash(npm install*)",
        "Bash(curl*)",
        "Bash(wget*)",
      ],
      model: args.model ?? "claude-sonnet-5",
      maxBudgetUsd: args.maxBudgetUsd ?? 5,
      // A turn cap stops runaway loops, but the real spend guard is
      // maxBudgetUsd. 15 proved too low: a first build that must also read
      // attachments spends several turns before it writes any code.
      maxTurns: args.maxTurns ?? 40,
      // No `thinking` override: Opus 5 runs adaptive thinking by default, and
      // `disabled` is rejected above effort `high`.
      ...(args.effort ? { effort: args.effort } : {}),
      ...(args.resume ? { resume: args.resume } : {}),
      // Deliberately NOT `...process.env`. This env reaches the agent's Bash
      // tool, so it must not carry DATABASE_URL or the AWS credentials —
      // generated code has no business touching the database or the bucket.
      //
      // ANTHROPIC_API_KEY *is* required: the SDK spawns a CLI subprocess that
      // authenticates with it (dropping it fails the run with "Not logged in").
      // So the key remains reachable from the agent's shell; isolating it needs
      // a real sandbox (container), not an env allow-list.
      env: {
        BUNDLE_ID: args.bundleId,
        PATH: `${repoBin}${path.delimiter}${process.env.PATH ?? ""}`,
        NODE_PATH: repoModules,
        HOME: process.env.HOME ?? "",
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
        IS_SANDBOX: "1",
      },
    },
  });

  for await (const message of q) {
    messages.push(message);
    args.onMessage?.(message);
    const m = message as {
      type?: string;
      session_id?: string;
      total_cost_usd?: number;
    };
    if (typeof m.session_id === "string") sessionId = m.session_id;
    if (m.type === "result" && typeof m.total_cost_usd === "number") {
      costUsd = m.total_cost_usd;
    }
  }

  return { messages, costUsd, sessionId };
}
