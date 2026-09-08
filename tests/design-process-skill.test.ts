import { describe, expect, it } from "vitest";

import { buildDesignProcessSkill } from "@/worker/lib/design-process-skill";

describe("buildDesignProcessSkill", () => {
  const md = buildDesignProcessSkill();

  it("is a valid skill file with a discoverable name and description", () => {
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain("name: design-process");
    expect(md).toMatch(/^description: .+/m);
  });

  it("embeds the rubric so the builder and the critique share one standard", () => {
    expect(md).toContain("Art direction (non-negotiable)");
    expect(md.toLowerCase()).toContain("eucalyptus");
  });

  it("orders the two passes: plan before code, review before build", () => {
    const plan = md.indexOf("PLAN.md");
    const review = md.indexOf("Pass two");
    expect(plan).toBeGreaterThan(-1);
    expect(review).toBeGreaterThan(plan);
  });

  it("specifies every section PLAN.md must contain", () => {
    const lower = md.toLowerCase();
    for (const part of ["colour", "type", "layout", "principles", "self-review"]) {
      expect(lower).toContain(part);
    }
  });

  it("treats the cover, not a landing-page hero, as the design problem", () => {
    expect(md).toContain("coverOpened");
    expect(md.toLowerCase()).toContain("the cover is the hero");
  });

  it("keeps copy localized through useLocale rather than hardcoded English", () => {
    expect(md).toContain("useLocale()");
  });
});
