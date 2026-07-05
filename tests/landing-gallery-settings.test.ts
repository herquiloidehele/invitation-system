import { describe, expect, it } from "vitest";

import {
  EMPTY_LANDING_GALLERY_SETTINGS,
  getFeaturesForCustomizationLevel,
  parseLandingGallerySettings,
  validateLandingGallerySettings,
} from "@/lib/landing-gallery-settings";

describe("landing gallery settings", () => {
  it("normalizes missing and malformed persisted values to empty lists", () => {
    expect(parseLandingGallerySettings(null)).toEqual(
      EMPTY_LANDING_GALLERY_SETTINGS,
    );
    expect(
      parseLandingGallerySettings({
        fullyCustomizableFeatures: "not-an-array",
        preDesignedFeatures: [1, null],
      }),
    ).toEqual(EMPTY_LANDING_GALLERY_SETTINGS);
  });

  it("trims persisted strings, removes blanks and case-insensitive duplicates, and preserves order", () => {
    expect(
      parseLandingGallerySettings({
        fullyCustomizableFeatures: [
          "  RSVP integrado ",
          "",
          "rsvp INTEGRADO",
          "Música",
        ],
        preDesignedFeatures: ["Mapa e localização"],
      }),
    ).toEqual({
      fullyCustomizableFeatures: ["RSVP integrado", "Música"],
      preDesignedFeatures: ["Mapa e localização"],
    });
  });

  it("rejects invalid admin payloads instead of silently truncating them", () => {
    expect(() =>
      validateLandingGallerySettings({
        fullyCustomizableFeatures: Array.from(
          { length: 9 },
          (_, index) => `Feature ${index}`,
        ),
        preDesignedFeatures: [],
      }),
    ).toThrow("Maximum 8 features per collection");

    expect(() =>
      validateLandingGallerySettings({
        fullyCustomizableFeatures: ["Music", " music "],
        preDesignedFeatures: [],
      }),
    ).toThrow("Feature labels must be unique");

    expect(() =>
      validateLandingGallerySettings({
        fullyCustomizableFeatures: ["x".repeat(61)],
        preDesignedFeatures: [],
      }),
    ).toThrow("Feature labels must be 60 characters or fewer");
  });

  it("maps each customization level to its independent feature list", () => {
    const settings = {
      fullyCustomizableFeatures: ["RSVP"],
      preDesignedFeatures: ["Fotografias"],
    };

    expect(
      getFeaturesForCustomizationLevel(settings, "fully_customizable"),
    ).toEqual(["RSVP"]);
    expect(
      getFeaturesForCustomizationLevel(settings, "pre_designed"),
    ).toEqual(["Fotografias"]);
  });
});
