import { describe, expect, it } from "vitest";

import { CritiqueSchema, critiqueToPrompt } from "@/worker/lib/critique";

const critique = {
  score: 6,
  verdict: "revise" as const,
  issues: [
    { severity: "high" as const, what: "Hero names are small and centered", fix: "Set names at 22vw, left-aligned, ampersand hung" },
    { severity: "low" as const, what: "Schedule uses uniform cards", fix: "Replace with a two-column ledger and hairline rules" },
  ],
};

describe("CritiqueSchema", () => {
  it("accepts a well-formed critique", () => {
    expect(CritiqueSchema.safeParse(critique).success).toBe(true);
  });

  it("caps issues at six", () => {
    const many = { ...critique, issues: Array(7).fill(critique.issues[0]) };
    expect(CritiqueSchema.safeParse(many).success).toBe(false);
  });
});

describe("critiqueToPrompt", () => {
  it("turns issues into an ordered fix list, high severity first", () => {
    const p = critiqueToPrompt(critique);
    expect(p.indexOf("22vw")).toBeLessThan(p.indexOf("ledger"));
    expect(p.toLowerCase()).toContain("do not redesign");
  });
});
