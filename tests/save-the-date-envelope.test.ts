import { describe, expect, it } from "vitest";
import { getSaveTheDateEnvelopeCoverBackground } from "../lib/save-the-date-envelope";

const themeEnvelope = {
  base: "#f7f0e8",
  topFlap: "/top.png",
  bottomFlap: "/bottom.png",
};

describe("getSaveTheDateEnvelopeCoverBackground", () => {
  it("returns the override coverBackground when provided", () => {
    const result = getSaveTheDateEnvelopeCoverBackground(themeEnvelope, {
      coverBackground: "https://cdn.example.com/std-cover.jpg",
    });
    expect(result).toBe("https://cdn.example.com/std-cover.jpg");
  });

  it("falls back to override.base when coverBackground is missing", () => {
    const result = getSaveTheDateEnvelopeCoverBackground(themeEnvelope, {
      base: "#111827",
    });
    expect(result).toBe("#111827");
  });

  it("falls back to the theme envelope.base when no override is provided", () => {
    const result = getSaveTheDateEnvelopeCoverBackground(themeEnvelope, null);
    expect(result).toBe("#f7f0e8");
  });
});
