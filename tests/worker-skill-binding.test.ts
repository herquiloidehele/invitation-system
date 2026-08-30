import { describe, expect, it } from "vitest";

import { buildPlatformSkill } from "@/worker/lib/skill";

describe("buildPlatformSkill — data binding", () => {
  const md = buildPlatformSkill('declare module "@platform" {}').toLowerCase();

  it("mandates reading content from props.invitation", () => {
    expect(md).toContain("props.invitation");
  });

  it("forbids hardcoding names/dates from the prompt", () => {
    expect(md).toMatch(/never hardcode|do not hardcode/);
    expect(md).toContain("prompt describes");
  });
});
