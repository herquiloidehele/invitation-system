import path from "node:path";

import { query } from "@anthropic-ai/claude-agent-sdk";

export interface BuildAgentResult {
  messages: unknown[];
  costUsd: number | null;
  sessionId: string | null;
}

const SYSTEM_PROMPT = `You are an expert frontend designer building a single, self-contained wedding-invitation component.

You are working inside a workspace. Load and follow the "platform" skill in .claude/skills before writing any code — it defines the @platform SDK you must build against and the mount contract.

Write your component to index.tsx. Import only from react, framer-motion, and @platform. Then run \`npm run build\` and fix any errors until it succeeds and writes dist/bundle.js.

The design must be distinctive and production-grade — never generic. When you are done and the build passes, stop.`;

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
  model?: string;
  maxBudgetUsd?: number;
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
      systemPrompt: SYSTEM_PROMPT,
      settingSources: ["project"],
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
      ...(args.resume ? { resume: args.resume } : {}),
      env: {
        ...process.env,
        BUNDLE_ID: args.bundleId,
        PATH: `${repoBin}${path.delimiter}${process.env.PATH ?? ""}`,
        NODE_PATH: repoModules,
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
