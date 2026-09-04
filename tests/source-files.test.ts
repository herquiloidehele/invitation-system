import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { collectSourceFiles, sourceFilesEqual } from "@/worker/lib/source-files";

async function scaffold() {
  const dir = await mkdtemp(path.join(tmpdir(), "ws-"));
  const put = async (rel: string, body: string) => {
    await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
    await writeFile(path.join(dir, rel), body);
  };
  await put("index.tsx", "export default 1");
  await put("theme.ts", "export const t = 1");
  await put("sections/Hero.tsx", "export const Hero = 1");
  await put("ui/Rule.tsx", "export const Rule = 1");
  // Everything below is harness-owned or generated and must NOT be captured.
  await put("shims/react.ts", "shim");
  await put("runtime.ts", "runtime");
  await put("platform.d.ts", "declare module '@platform' {}");
  await put("build.mjs", "build");
  await put("dist/bundle.js", "bundle");
  await put("refs/moodboard.png", "png");
  await put(".claude/skills/platform/SKILL.md", "skill");
  await put("NEEDS_INPUT.md", "?");
  await put(".tsbuildinfo", "{}");
  return dir;
}

describe("collectSourceFiles", () => {
  it("captures the agent's source tree and nothing the harness owns", async () => {
    const files = await collectSourceFiles(await scaffold());
    expect(Object.keys(files).sort()).toEqual([
      "index.tsx",
      "sections/Hero.tsx",
      "theme.ts",
      "ui/Rule.tsx",
    ]);
    expect(files["sections/Hero.tsx"]).toBe("export const Hero = 1");
  });
});

describe("sourceFilesEqual", () => {
  it("ignores key order and detects content changes", () => {
    expect(sourceFilesEqual({ a: "1", b: "2" }, { b: "2", a: "1" })).toBe(true);
    expect(sourceFilesEqual({ a: "1" }, { a: "2" })).toBe(false);
    expect(sourceFilesEqual({ a: "1" }, { a: "1", b: "2" })).toBe(false);
  });
});
