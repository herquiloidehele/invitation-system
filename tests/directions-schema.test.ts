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

describe("directionToPrompt", () => {
  it("carries the palette, typography and a do-not-substitute instruction", () => {
    const text = directionToPrompt(sample);
    expect(text).toContain("#0b1d26");
    expect(text).toContain("Cormorant Garamond");
    expect(text.toLowerCase()).toContain("do not substitute");
  });
});
