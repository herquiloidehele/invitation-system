import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { getObjectBuffer } from "@/lib/s3";
import { buildPlatformSkill } from "./lib/skill";
import type { AttachmentRecord } from "./persistence";
import {
  workspacePackageJson,
  workspaceTsconfig,
} from "./lib/workspace-files";

const TEMPLATE_DIR = path.join(process.cwd(), "worker", "templates");

/** esbuild driver copied into the workspace; the agent runs it via `npm run build`. */
function buildScript(): string {
  return `import { build } from "esbuild";
import path from "node:path";
const root = process.cwd();
await build({
  entryPoints: [path.join(root, "index.tsx")],
  outfile: path.join(root, "dist/bundle.js"),
  bundle: true, format: "iife", target: "es2020", jsx: "automatic", minify: true,
  alias: {
    react: path.join(root, "shims/react.ts"),
    "react/jsx-runtime": path.join(root, "shims/jsx-runtime.ts"),
    "framer-motion": path.join(root, "shims/framer-motion.ts"),
    "@platform": path.join(root, "shims/platform.ts"),
  },
  define: { __BUNDLE_ID__: JSON.stringify(process.env.BUNDLE_ID ?? "bundle") },
});
console.log("built dist/bundle.js");
`;
}

/**
 * Materialize a fresh workspace: the shim template, tsconfig, package.json, the
 * esbuild driver, and the `@platform` skill. Returns the workspace path.
 */
export async function provisionWorkspace(
  workspaceDir: string,
  dtsContent: string,
  priorSource?: Record<string, string> | null,
  attachments?: AttachmentRecord[] | null,
): Promise<string> {
  await mkdir(workspaceDir, { recursive: true });
  await cp(TEMPLATE_DIR, workspaceDir, { recursive: true });
  await writeFile(path.join(workspaceDir, "tsconfig.json"), workspaceTsconfig());
  await writeFile(path.join(workspaceDir, "package.json"), workspacePackageJson());
  await writeFile(path.join(workspaceDir, "build.mjs"), buildScript());

  const skillDir = path.join(workspaceDir, ".claude", "skills", "platform");
  await mkdir(skillDir, { recursive: true });
  await writeFile(path.join(skillDir, "SKILL.md"), buildPlatformSkill(dtsContent));

  // Resuming: rehydrate the last revision's source so the agent edits it.
  if (priorSource?.["index.tsx"]) {
    await writeFile(
      path.join(workspaceDir, "index.tsx"),
      priorSource["index.tsx"],
    );
  }

  // A question from a previous turn must not be re-detected as a new one.
  await rm(path.join(workspaceDir, "NEEDS_INPUT.md"), { force: true });

  // Uploaded files, so the agent can actually look at them.
  if (attachments?.length) {
    const refsDir = path.join(workspaceDir, "refs");
    await mkdir(refsDir, { recursive: true });
    for (const attachment of attachments) {
      const buffer = await getObjectBuffer(attachment.objectKey);
      await writeFile(path.join(refsDir, attachment.name), buffer);
    }
  }

  return workspaceDir;
}
