import { describe, expect, it } from "vitest";

import { DirectionsSchema, directionToPrompt } from "@/worker/lib/directions";

const sample = {
  id: "a",
  name: "Coastal Nocturne",
  palette: ["#0b1d26", "#f4efe6", "#c8a66b"],
  typography: "Cormorant Garamond + Karla",
  motion: "Slow horizon reveal timed off coverOpened",
  composition: "Full-bleed hero, asymmetric lower third",
  rationale: "Evening seaside venue in summer",
  signatureDetails: [
    "Names in 22vw Fraunces with a hung ampersand",
    "Schedule as a two-column ledger with hairline rules",
    "Audio toggle is a wax-seal that fills when playing",
  ],
};

describe("DirectionsSchema", () => {
  it("accepts a well-formed proposal", () => {
    expect(DirectionsSchema.safeParse({ directions: [sample] }).success).toBe(
      true,
    );
  });

  it("rejects a direction missing its rationale", () => {
    const { rationale: _omitted, ...withoutRationale } = sample;
    const parsed = DirectionsSchema.safeParse({
      directions: [withoutRationale],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("signatureDetails", () => {
  it("requires exactly three", () => {
    expect(
      DirectionsSchema.safeParse({
        directions: [{ ...sample, signatureDetails: ["only one"] }],
      }).success,
    ).toBe(false);
  });

  it("puts them in the build prompt", () => {
    expect(directionToPrompt(sample)).toContain("hung ampersand");
  });
});

describe("directionToPrompt", () => {
  it("carries the palette, typography and a do-not-substitute instruction", () => {
    const text = directionToPrompt(sample);
    expect(text).toContain("#0b1d26");
    expect(text).toContain("Cormorant Garamond");
    expect(text.toLowerCase()).toContain("do not substitute");
  });
});
