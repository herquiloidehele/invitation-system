import { describe, expect, it } from "vitest";
import {
  applyLandingTranslationDraft,
  buildLandingTranslationDraft,
  localizeLandingMetadata,
  sanitizeLandingTranslations,
} from "@/lib/landing-translations";

describe("landing metadata translations", () => {
  it("keeps only supported non-blank string fields", () => {
    expect(
      sanitizeLandingTranslations({
        en: {
          landingModelName: "  Classic  ",
          landingSubtitle: " ",
          landingDescription: 42,
          unknown: "discard",
        },
        es: {
          landingDescription: "Invitación digital",
        },
        fr: {
          landingModelName: "Classique",
        },
      }),
    ).toEqual({
      en: {
        landingModelName: "  Classic  ",
      },
      es: {
        landingDescription: "Invitación digital",
      },
    });
  });

  it("returns undefined when no valid translation remains", () => {
    expect(
      sanitizeLandingTranslations({
        en: { landingModelName: " " },
        es: null,
      }),
    ).toBeUndefined();
    expect(sanitizeLandingTranslations("invalid")).toBeUndefined();
  });

  it("localizes each field independently with Portuguese fallback", () => {
    const source = {
      landingModelName: "Clássico",
      landingSubtitle: "Elegante",
      landingDescription: "Convite em papel",
      landingTranslations: {
        en: {
          landingModelName: "Classic",
          landingDescription: "Paper invitation",
        },
      },
    };

    expect(localizeLandingMetadata(source, "en")).toMatchObject({
      landingModelName: "Classic",
      landingSubtitle: "Elegante",
      landingDescription: "Paper invitation",
    });
    expect(localizeLandingMetadata(source, "pt")).toMatchObject({
      landingModelName: "Clássico",
      landingSubtitle: "Elegante",
      landingDescription: "Convite em papel",
    });
    expect(source.landingModelName).toBe("Clássico");
  });

  it("builds sparse translation drafts without substituting fallback text", () => {
    expect(
      buildLandingTranslationDraft(
        {
          landingModelName: "Clássico",
          landingSubtitle: "Elegante",
          landingDescription: "Convite em papel",
          landingTranslations: {
            es: {
              landingModelName: "Clásico",
            },
          },
        },
        "es",
      ),
    ).toEqual({
      landingModelName: "Clásico",
      landingSubtitle: "",
      landingDescription: "",
    });
  });

  it("builds the Portuguese draft from canonical fields", () => {
    expect(
      buildLandingTranslationDraft(
        {
          landingModelName: "Clássico",
          landingSubtitle: null,
          landingDescription: undefined,
          landingTranslations: {
            en: {
              landingModelName: "Classic",
            },
          },
        },
        "pt",
      ),
    ).toEqual({
      landingModelName: "Clássico",
      landingSubtitle: "",
      landingDescription: "",
    });
  });

  it("merges one locale without changing another locale", () => {
    expect(
      applyLandingTranslationDraft(
        {
          en: {
            landingModelName: "Classic",
          },
          es: {
            landingDescription: "Invitación digital",
          },
        },
        "en",
        {
          landingModelName: "Classic",
          landingSubtitle: "Elegant",
          landingDescription: "",
        },
      ),
    ).toEqual({
      en: {
        landingModelName: "Classic",
        landingSubtitle: "Elegant",
      },
      es: {
        landingDescription: "Invitación digital",
      },
    });
  });

  it("removes blank fields and the empty locale overlay", () => {
    expect(
      applyLandingTranslationDraft(
        {
          en: {
            landingModelName: "Classic",
            landingSubtitle: "Elegant",
          },
        },
        "en",
        {
          landingModelName: "",
          landingSubtitle: " ",
          landingDescription: "",
        },
      ),
    ).toBeUndefined();
  });
});
