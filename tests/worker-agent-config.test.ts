import { describe, expect, it } from "vitest";

import { ENABLED_SKILLS, buildSystemPrompt } from "@/worker/agent";
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

  it("keeps the rubric out of the prefix — it belongs to the skill and the critique", () => {
    const prompt = buildSystemPrompt(dts).toLowerCase();
    expect(prompt).not.toContain("eucalyptus");
    expect(prompt).not.toContain("art direction (non-negotiable)");
  });

  it("tells an edit turn to stay inside the design already on disk", () => {
    const prompt = buildSystemPrompt(dts);
    expect(prompt).toContain("PLAN.md");
    expect(prompt).toContain("theme.ts");
  });

  it("is byte-identical across calls, so resumed turns keep their cache", () => {
    expect(buildSystemPrompt(dts)).toBe(buildSystemPrompt(dts));
  });
});

describe("ENABLED_SKILLS", () => {
  it("is an explicit allow-list, never a wildcard", () => {
    expect(Array.isArray(ENABLED_SKILLS)).toBe(true);
    expect(ENABLED_SKILLS).not.toContain("all");
  });

  it("names exactly the three skills provisionWorkspace writes", () => {
    expect([...ENABLED_SKILLS].sort()).toEqual([
      "design-process",
      "phone-craft",
      "platform",
    ]);
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
