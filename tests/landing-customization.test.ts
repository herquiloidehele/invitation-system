import { describe, expect, it } from "vitest";

import {
  DEFAULT_LANDING_CUSTOMIZATION_LEVEL,
  getLandingCustomizationBadge,
  isPreDesigned,
  normalizeLandingCustomizationLevel,
} from "@/lib/landing-customization";

describe("landing customization levels", () => {
  it("defaults missing and unknown values to fully customizable", () => {
    expect(DEFAULT_LANDING_CUSTOMIZATION_LEVEL).toBe("fully_customizable");
    expect(normalizeLandingCustomizationLevel(undefined)).toBe(
      "fully_customizable",
    );
    expect(normalizeLandingCustomizationLevel("unknown")).toBe(
      "fully_customizable",
    );
  });

  it("recognizes pre-designed models", () => {
    expect(normalizeLandingCustomizationLevel("pre_designed")).toBe(
      "pre_designed",
    );
    expect(isPreDesigned("pre_designed")).toBe(true);
    expect(isPreDesigned("fully_customizable")).toBe(false);
  });

  it("shows a customization badge only for pre-designed models", () => {
    expect(getLandingCustomizationBadge("pre_designed", "Pre-designed")).toBe(
      "Pre-designed",
    );
    expect(
      getLandingCustomizationBadge("fully_customizable", "Pre-designed"),
    ).toBeNull();
  });
});
