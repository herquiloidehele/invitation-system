import { describe, expect, it } from "vitest";

import { buildFontBrief } from "@/worker/lib/font-brief";
import type { FontAssetRecord } from "@/worker/persistence";

const font: FontAssetRecord = {
  id: "f1",
  customFontFamilyId: "abc",
  family: "Cormorant Display",
  cssFamily: "custom-font-abc",
  category: "display",
};

const second: FontAssetRecord = {
  id: "f2",
  customFontFamilyId: "def",
  family: "Work Body",
  cssFamily: "custom-font-def",
  category: "sans-serif",
};

describe("buildFontBrief", () => {
  it("is empty when nothing was uploaded", () => {
    expect(buildFontBrief([])).toBe("");
  });

  it("keeps the id-bearing <Font> load tag (only place the id appears)", () => {
    const brief = buildFontBrief([font]);
    expect(brief).toContain('<Font family="custom-font-abc" />');
  });

  it("gives the readable human-name stack for CSS/theme, not the id", () => {
    const brief = buildFontBrief([font]);
    expect(brief).toContain("'Cormorant Display', serif");
    // The theme/CSS stack must NOT be the opaque id stack.
    expect(brief).not.toContain("'custom-font-abc', serif");
  });

  it("instructs the agent to apply it as the primary typeface", () => {
    const brief = buildFontBrief([font]).toLowerCase();
    expect(brief).toContain("primary");
    expect(brief).toContain("unless");
  });

  it("tells the agent not to fall back to google/builtin fonts for headings", () => {
    const brief = buildFontBrief([font]).toLowerCase();
    expect(brief).toContain("do not use a google");
  });

  it("lists every uploaded font with its readable stack", () => {
    const brief = buildFontBrief([font, second]);
    expect(brief).toContain('<Font family="custom-font-abc" />');
    expect(brief).toContain('<Font family="custom-font-def" />');
    expect(brief).toContain("'Cormorant Display', serif");
    expect(brief).toContain("'Work Body', sans-serif");
  });
});
