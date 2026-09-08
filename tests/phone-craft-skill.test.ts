import { describe, expect, it } from "vitest";

import { buildPhoneCraftSkill } from "@/worker/lib/phone-craft-skill";

describe("buildPhoneCraftSkill", () => {
  const md = buildPhoneCraftSkill();

  it("is a valid skill file with a discoverable name and description", () => {
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain("name: phone-craft");
    expect(md).toMatch(/^description: .+/m);
  });

  it("carries the mobile viewport and safe-area rules", () => {
    expect(md).toContain("100dvh");
    expect(md).toContain("env(safe-area-inset-bottom)");
  });

  it("forbids animating layout properties", () => {
    const lower = md.toLowerCase();
    expect(lower).toContain("prefers-reduced-motion");
    for (const prop of ["width", "height", "top", "left"]) {
      expect(lower).toContain(prop);
    }
  });

  it("states that RSVP validation is platform-owned, not the agent's to build", () => {
    expect(md).toContain("useRsvp()");
    expect(md.toLowerCase()).toMatch(/never re-implement|platform-owned/);
  });

  it("names every rsvp status the agent must design a state for", () => {
    for (const status of ["submitting", "success", "closed", "already_submitted"]) {
      expect(md).toContain(status);
    }
  });

  it("carries the Instagram webview memory rules", () => {
    const lower = md.toLowerCase();
    expect(lower).toContain("backdrop-filter");
    expect(lower).toContain("webview");
  });

  it("requires explicit media dimensions to prevent layout shift", () => {
    expect(md).toContain("<Media>");
    expect(md.toLowerCase()).toContain("reserve their space");
  });
});
