import { describe, expect, it } from "vitest";

import {
  CritiqueSchema,
  FidelityCritiqueSchema,
  critiqueContent,
  critiqueInstruction,
  critiqueToPrompt,
} from "@/worker/lib/critique";

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

describe("critiqueInstruction", () => {
  const brief = "Invitation config (bind content to props.invitation)";

  it("grades against the art direction when no reference was replicated", () => {
    const text = critiqueInstruction({ shotCount: 3, referenceCount: 0, brief });

    expect(text).toContain("Montserrat");
    expect(text).toMatch(/judge only what you can see/i);
  });

  it("labels which images are the reference and which are the build", () => {
    const text = critiqueInstruction({ shotCount: 3, referenceCount: 2, brief });

    expect(text).toMatch(/first 2 images/i);
    expect(text).toMatch(/reference/i);
    expect(text).toMatch(/remaining 3/i);
  });

  it("grades fidelity instead of taste once a reference is present", () => {
    const text = critiqueInstruction({ shotCount: 3, referenceCount: 1, brief });

    expect(text).toMatch(/differs|difference/i);
    expect(text).not.toContain("Montserrat");
  });

  it("does not report the licensed deviations as differences", () => {
    const text = critiqueInstruction({ shotCount: 3, referenceCount: 1, brief });

    expect(text).toMatch(/reflow/i);
    expect(text).toMatch(/real (content|data)/i);
  });

  it("still holds the build to what a reference cannot excuse", () => {
    const text = critiqueInstruction({ shotCount: 3, referenceCount: 1, brief });

    expect(text.toLowerCase()).toContain("lorem");
    expect(text).toMatch(/real data/i);
  });

  it("keeps the phone width in the instruction when the capture knows it", () => {
    const text = critiqueInstruction({
      shotCount: 3,
      referenceCount: 0,
      brief,
      width: 390,
    });

    expect(text).toContain("390px");
  });
});

describe("FidelityCritiqueSchema", () => {
  it("accepts the same shape as the taste critique", () => {
    expect(FidelityCritiqueSchema.safeParse(critique).success).toBe(true);
  });

  it("scores against the reference rather than against templates", () => {
    const description = FidelityCritiqueSchema.shape.score.description ?? "";

    expect(description).toMatch(/reference/i);
  });
});

describe("critiqueContent", () => {
  const instruction = "Report what differs.";

  it("sends the reference first, then the build shots, then the instruction", () => {
    const content = critiqueContent({
      images: [{ jpeg: Buffer.from("shot") }],
      references: [{ data: Buffer.from("ref"), mediaType: "image/png" }],
      instruction,
    });

    expect(content.map((b) => b.type)).toEqual(["image", "image", "text"]);
    expect(content[0]).toMatchObject({
      source: { media_type: "image/png", data: Buffer.from("ref").toString("base64") },
    });
    expect(content[1]).toMatchObject({ source: { media_type: "image/jpeg" } });
    expect(content[2]).toMatchObject({ text: instruction });
  });

  it("sends only the build shots when nothing was replicated", () => {
    const content = critiqueContent({
      images: [{ jpeg: Buffer.from("shot") }, { jpeg: Buffer.from("shot2") }],
      references: [],
      instruction,
    });

    expect(content.map((b) => b.type)).toEqual(["image", "image", "text"]);
    expect(content[0]).toMatchObject({ source: { media_type: "image/jpeg" } });
  });
});
