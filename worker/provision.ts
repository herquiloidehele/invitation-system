import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildPlatformSkill } from "./lib/skill";
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
): Promise<string> {
  await mkdir(workspaceDir, { recursive: true });
  await cp(TEMPLATE_DIR, workspaceDir, { recursive: true });
  await writeFile(path.join(workspaceDir, "tsconfig.json"), workspaceTsconfig());
  await writeFile(path.join(workspaceDir, "package.json"), workspacePackageJson());
  await writeFile(path.join(workspaceDir, "build.mjs"), buildScript());

  const skillDir = path.join(workspaceDir, ".claude", "skills", "platform");
  await mkdir(skillDir, { recursive: true });
  await writeFile(path.join(skillDir, "SKILL.md"), buildPlatformSkill(dtsContent));

  return workspaceDir;
}
