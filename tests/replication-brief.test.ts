import { describe, expect, it } from "vitest";

import { buildReplicationBrief } from "@/worker/lib/replication-brief";
import { REPLICATION_MANIFEST } from "@/worker/lib/replication-manifest";

describe("buildReplicationBrief", () => {
  it("is empty when nothing is attached", () => {
    expect(buildReplicationBrief(false)).toBe("");
  });

  it("calls a design reference a spec rather than inspiration", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/spec/i);
    expect(brief).toMatch(/not (a )?(mood ?board|inspiration)/i);
  });

  it("names the measurable properties that must match", () => {
    const brief = buildReplicationBrief(true).toLowerCase();

    for (const property of [
      "hex",
      "type scale",
      "weight",
      "tracking",
      "spacing",
      "radi",
      "crop",
    ]) {
      expect(brief).toContain(property);
    }
  });

  it("requires the values to be measured into PLAN.md before any code", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toContain("PLAN.md");
    expect(brief).toMatch(/before you write any/i);
  });

  it("licenses the phone reflow as a deviation but not the content", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/reflow/i);
    expect(brief).toContain("props.invitation");
    expect(brief).toMatch(/never .*(dummy|placeholder) (names|text)/i);
  });

  it("extends the reference's system to sections it does not show", () => {
    expect(buildReplicationBrief(true)).toMatch(
      /sections the reference does not show/i,
    );
  });

  it("keeps the craft floor and real data above the reference", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/phone-craft|craft floor/i);
    expect(brief).toMatch(/real data/i);
  });

  it("warns off the instinct to improve on the reference", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/rather than improving|do not improve/i);
  });

  it("does not argue with a rulebook the agent can no longer see", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).not.toMatch(/art direction|ban list|outranks/i);
  });

  it("substitutes the closest Google font and says so", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/closest/i);
    expect(brief).toMatch(/google fonts/i);
    expect(brief).toMatch(/upload/i);
  });

  it("ends the turn with the substitutions it made", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/placeholder/i);
    expect(brief).toMatch(/could not reproduce/i);
  });

  it("names the manifest file the critique reads", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toContain(REPLICATION_MANIFEST);
  });

  it("keeps files rendered as content out of the manifest", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/do not list/i);
    expect(brief).toMatch(/content/i);
  });

  it("lets a reference supersede a design the invitation already has", () => {
    const brief = buildReplicationBrief(true);

    expect(brief).toMatch(/theme\.ts/);
    expect(brief).toMatch(/supersede|replaces|wins/i);
  });
});
