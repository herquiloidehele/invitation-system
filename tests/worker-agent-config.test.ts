import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/worker/agent";
import { workspaceTsconfig } from "@/worker/lib/workspace-files";

describe("buildSystemPrompt", () => {
  const dts = "declare module '@platform' { export const useRsvp: unknown; }";

  it("inlines the platform contract so the agent need not read the skill file", () => {
    const prompt = buildSystemPrompt(dts);
    expect(prompt).toContain("useRsvp");
  });

  it("does not instruct the agent to go read the skill first", () => {
    expect(buildSystemPrompt(dts).toLowerCase()).not.toContain(
      'load and follow the "platform" skill',
    );
  });

  it("keeps the content-from-props rule", () => {
    expect(buildSystemPrompt(dts)).toContain("props.invitation");
  });

  it("inlines the art direction so design rules need no extra turn", () => {
    const prompt = buildSystemPrompt(dts).toLowerCase();
    expect(prompt).toContain("art direction");
    expect(prompt).toContain("inter");
  });
});

describe("workspaceTsconfig", () => {
  it("enables incremental builds so tsc retries are cheap", () => {
    const cfg = JSON.parse(workspaceTsconfig()) as {
      compilerOptions: Record<string, unknown>;
    };
    expect(cfg.compilerOptions.incremental).toBe(true);
    expect(cfg.compilerOptions.skipLibCheck).toBe(true);
  });
});
