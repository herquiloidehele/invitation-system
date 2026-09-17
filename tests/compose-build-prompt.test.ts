import { describe, expect, it } from "vitest";

import { composeBuildPrompt } from "@/worker/lib/compose-prompt";

const parts = {
  brief: "INVITATION-BRIEF",
  manifest: "MANIFEST",
  recap: "RECAP",
  attachmentBrief: "ATTACHMENTS",
  replicationBrief: "REPLICATION",
  fontBrief: "FONTS",
  stockBrief: "STOCK",
  elementBrief: "ELEMENT",
  planBrief: "PLAN",
  prompt: "WHAT THE ADMIN ASKED",
};

const orderOf = (text: string, labels: string[]) =>
  labels.map((l) => text.indexOf(l));

describe("composeBuildPrompt", () => {
  it("keeps the admin's own words last", () => {
    const text = composeBuildPrompt(parts);

    expect(text.trimEnd().endsWith("WHAT THE ADMIN ASKED")).toBe(true);
  });

  it("puts the replication contract after the file list that points at it", () => {
    const text = composeBuildPrompt(parts);

    expect(text.indexOf("ATTACHMENTS")).toBeLessThan(text.indexOf("REPLICATION"));
  });

  it("holds the whole order: brief, state, files, craft, then the ask", () => {
    const text = composeBuildPrompt(parts);
    const positions = orderOf(text, [
      "INVITATION-BRIEF",
      "MANIFEST",
      "RECAP",
      "ATTACHMENTS",
      "REPLICATION",
      "FONTS",
      "STOCK",
      "ELEMENT",
      "PLAN",
      "WHAT THE ADMIN ASKED",
    ]);

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((p) => p >= 0)).toBe(true);
  });

  it("leaves out the parts that do not apply to this turn", () => {
    const text = composeBuildPrompt({
      ...parts,
      recap: "",
      attachmentBrief: "",
      replicationBrief: "",
      elementBrief: "",
      planBrief: "",
    });

    expect(text).not.toContain("REPLICATION");
    expect(text).toContain("STOCK");
    expect(text).not.toMatch(/\n{3,}/);
  });
});
