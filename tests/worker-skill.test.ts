import { describe, expect, it } from "vitest";

import { buildPlatformSkill } from "@/worker/lib/skill";

const DTS = `declare module "@platform" {\n  export function useGifts(): unknown;\n}`;

describe("buildPlatformSkill", () => {
  it("produces SKILL.md front-matter with a name", () => {
    const md = buildPlatformSkill(DTS);
    expect(md).toMatch(/^---\n/);
    expect(md).toMatch(/name:\s*platform/);
  });

  it("embeds the .d.ts contract verbatim in a ts code block", () => {
    const md = buildPlatformSkill(DTS);
    expect(md).toContain("```ts");
    expect(md).toContain('declare module "@platform"');
    expect(md).toContain("useGifts");
  });

  it("states the mount contract (default export + registration)", () => {
    const md = buildPlatformSkill(DTS);
    expect(md.toLowerCase()).toContain("default export");
  });
});
