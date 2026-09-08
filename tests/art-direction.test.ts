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
});
