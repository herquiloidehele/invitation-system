import { describe, expect, it } from "vitest";

import { normalizeParsedMetadata } from "@/lib/custom-fonts/parser";

describe("custom font metadata", () => {
  it("normalizes an italic bold face", () => {
    expect(
      normalizeParsedMetadata({
        familyName: "  Atelier  ",
        subfamilyName: "Bold Italic",
        weightClass: 700,
        italicAngle: -12,
        postscriptName: "Atelier-BoldItalic",
      }),
    ).toMatchObject({
      familyName: "Atelier",
      weight: 700,
      style: "italic",
    });
  });

  it("uses regular weight for malformed weight metadata", () => {
    expect(
      normalizeParsedMetadata({ familyName: "Atelier", weightClass: 0 }),
    ).toMatchObject({ weight: 400, style: "normal" });
  });

  it("rejects an empty family name", () => {
    expect(() =>
      normalizeParsedMetadata({ familyName: "   ", weightClass: 400 }),
    ).toThrow("Font family metadata is missing");
  });
});
