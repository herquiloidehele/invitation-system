import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { provisionWorkspace } from "./provision";
import { runBuildAgent } from "./agent";
import { bundleRegistersComponent } from "./lib/verify-bundle";

function compactMessage(message: unknown): string | null {
  const m = message as {
    type?: string;
    subtype?: string;
    total_cost_usd?: number;
    message?: { content?: Array<{ type?: string; text?: string; name?: string }> };
  };
  if (m.type === "assistant" && Array.isArray(m.message?.content)) {
    const parts = m.message!.content
      .map((b) =>
        b.type === "text"
          ? (b.text ?? "").slice(0, 200)
          : b.type === "tool_use"
            ? `[tool: ${b.name}]`
            : null,
      )
      .filter(Boolean);
    return parts.length ? `assistant: ${parts.join(" ")}` : null;
  }
  if (m.type === "result") {
    return `result (${m.subtype}) cost=${m.total_cost_usd ?? "?"}`;
  }
  return null;
}

async function main() {
  const prompt = process.argv.slice(2).join(" ").trim();
  if (!prompt) {
    console.error('Usage: npx tsx worker/build-invitation.ts "<prompt>"');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set (or run `ant auth login`).");
    process.exit(1);
  }

  const bundleId = "cli-build";
  const repoRoot = process.cwd();
  const dts = await readFile(
    path.join(repoRoot, "worker", "templates", "platform.d.ts"),
    "utf8",
  );

  // Workspace lives under the repo so the build resolves the repo's tsc/esbuild.
  const workspace = path.join(
    repoRoot,
    ".ai-workspaces",
    `build-${Date.now()}`,
  );
  await mkdir(workspace, { recursive: true });
  console.log(`workspace: ${workspace}`);

  await provisionWorkspace(workspace, dts);

  const { costUsd } = await runBuildAgent({
    workspaceDir: workspace,
    prompt,
    bundleId,
    dts,
    onMessage: (m) => {
      const line = compactMessage(m);
      if (line) console.log(line);
    },
  });
  console.log(
    `agent finished. cost: ${costUsd == null ? "unknown" : `$${costUsd.toFixed(2)}`}`,
  );

  const bundlePath = path.join(workspace, "dist", "bundle.js");
  let code: string;
  try {
    code = await readFile(bundlePath, "utf8");
  } catch {
    console.error(
      `FAIL: no bundle at ${bundlePath} — the agent did not produce a build.`,
    );
    process.exit(2);
    return;
  }

  const ok = bundleRegistersComponent(code, bundleId);
  console.log(
    ok
      ? `PASS: ${bundlePath} registers a component.`
      : "FAIL: bundle did not register a component.",
  );
  console.log(`Inspect the bundle and workspace at: ${workspace}`);
  process.exit(ok ? 0 : 3);
}

void main();
