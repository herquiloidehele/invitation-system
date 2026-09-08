import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Directories the harness owns or generates — never part of the revision. */
const SKIP_DIRS = new Set(["shims", "dist", "refs", "node_modules", ".claude"]);
/** Root-level files the harness writes — never part of the revision. */
const SKIP_FILES = new Set([
  "runtime.ts",
  "platform.d.ts",
  "build.mjs",
  "tsconfig.json",
  "package.json",
  "NEEDS_INPUT.md",
  ".tsbuildinfo",
]);
// `.md` is here for PLAN.md — the design decision record the agent writes on a
// first build. Persisting it means a rotated or redeployed session re-orients
// from the real design rationale instead of reconstructing intent from chat.
// NEEDS_INPUT.md is excluded by name in SKIP_FILES above.
const SOURCE_EXT = new Set([".ts", ".tsx", ".css", ".md"]);

/**
 * Every file the agent authored, keyed by workspace-relative POSIX path.
 * The revision must carry the whole tree, not just index.tsx, now that the
 * agent is told to split sections into their own files.
 */
export async function collectSourceFiles(
  workspaceDir: string,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(rel: string) {
    const entries = await readdir(path.join(workspaceDir, rel), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          await walk(relPath);
        }
        continue;
      }
      if (rel === "" && SKIP_FILES.has(entry.name)) continue;
      if (!SOURCE_EXT.has(path.extname(entry.name))) continue;
      out[relPath] = await readFile(path.join(workspaceDir, relPath), "utf8");
    }
  }
  await walk("");
  return out;
}

/** Same files with the same contents, regardless of key order. */
export function sourceFilesEqual(
  a: Record<string, string> | null | undefined,
  b: Record<string, string> | null | undefined,
): boolean {
  const ka = Object.keys(a ?? {}).sort();
  const kb = Object.keys(b ?? {}).sort();
  if (ka.length !== kb.length) return false;
  return ka.every((k, i) => k === kb[i] && a![k] === b![k]);
}
