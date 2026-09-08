import { describe, expect, it } from "vitest";

import { buildPlanBrief } from "@/worker/lib/plan-brief";

describe("buildPlanBrief", () => {
  it("contributes nothing on a turn that is not a first build", () => {
    expect(buildPlanBrief(false)).toBe("");
  });

  it("orders the plan before the code on a first build", () => {
    const text = buildPlanBrief(true);
    const plan = text.indexOf("PLAN.md");
    const code = text.indexOf(".tsx");
    expect(plan).toBeGreaterThan(-1);
    expect(code).toBeGreaterThan(-1);
    expect(code).toBeLessThan(plan);
  });

  it("names both skills by their exact directory names", () => {
    const text = buildPlanBrief(true);
    expect(text).toContain("design-process");
    expect(text).toContain("phone-craft");
  });

  it("protects PLAN.md from being cleaned up at the end of the build", () => {
    expect(buildPlanBrief(true).toLowerCase()).toContain("do not delete");
  });
});
