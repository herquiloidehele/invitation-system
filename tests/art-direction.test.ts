import { describe, expect, it } from "vitest";

import { artDirection } from "@/worker/lib/art-direction";

describe("artDirection", () => {
  it("bans the specific slop fonts by name", () => {
    const text = artDirection().toLowerCase();
    for (const font of ["inter", "roboto", "open sans", "montserrat"]) {
      expect(text).toContain(font);
    }
  });

  it("bans the generic purple gradient", () => {
    expect(artDirection().toLowerCase()).toContain("gradient");
  });

  it("tells the agent to derive the palette from real content", () => {
    expect(artDirection().toLowerCase()).toContain("props.invitation");
  });

  it("names the wedding-genre defaults, not just the generic AI ones", () => {
    const text = artDirection().toLowerCase();
    for (const tell of [
      "eucalyptus",
      "save the date",
      "scrim",
      "laurel",
      "#f4f1ea",
      "#d97757",
    ]) {
      expect(text).toContain(tell);
    }
  });

  it("frames the tells as defaults rather than bans", () => {
    const text = artDirection().toLowerCase();
    expect(text).toContain("the brief's own words always win");
  });

  it("drops the taste rules entirely when a reference is being replicated", () => {
    const text = artDirection({ replicating: true });

    expect(text).not.toContain("Montserrat");
    expect(text).not.toContain("#667eea");
    expect(text.toLowerCase()).not.toContain("eucalyptus");
  });

  it("keeps the non-negotiables that a reference cannot excuse", () => {
    const text = artDirection({ replicating: true });

    expect(text.toLowerCase()).toContain("lorem");
    expect(text).toMatch(/real data/i);
    expect(text).toContain("prefers-reduced-motion");
  });

  it("never argues with itself about which rule wins", () => {
    const text = artDirection({ replicating: true });

    expect(text).not.toMatch(/outranks|do not apply|does not apply/i);
  });

  it("is the full rubric by default", () => {
    expect(artDirection()).toContain("Montserrat");
    expect(artDirection({ replicating: false })).toContain("Montserrat");
  });
});
