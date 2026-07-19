import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("landing metadata translation editor", () => {
  it("edits all landing strings in Portuguese, English, and Spanish", () => {
    const source = readFileSync(
      "components/admin/LandingMetadataFieldset.tsx",
      "utf8",
    );

    expect(source).toContain("landingSubtitle: string | null");
    expect(source).toContain("landingTranslations: LandingTranslations | null");
    expect(source).toContain("buildLandingTranslationDraft");
    expect(source).toContain("applyLandingTranslationDraft");
    expect(source).toContain('["pt", "en", "es"]');
    expect(source).toContain("Nome do modelo");
    expect(source).toContain("Subtítulo");
    expect(source).toContain("Descrição curta");
    expect(source).toContain("placeholder={portugueseDraft.landingModelName}");
    expect(source).toContain("placeholder={portugueseDraft.landingSubtitle}");
    expect(source).toContain(
      "placeholder={portugueseDraft.landingDescription}",
    );
  });

  it.each([
    "app/admin/invitations/InvitationForm.tsx",
    "app/admin/invitations/ExternalInvitationForm.tsx",
    "app/admin/save-the-dates/SaveTheDateForm.tsx",
  ])("passes and updates both new properties in %s", (file) => {
    const source = readFileSync(file, "utf8");

    expect(source).toContain("landingSubtitle:");
    expect(source).toContain("landingTranslations:");
    expect(source).toMatch(/landingSubtitle(?:",|:)\s*next\.landingSubtitle/);
    expect(source).toMatch(
      /landingTranslations(?:",|:)\s*next\.landingTranslations/,
    );
  });

  it("submits both fields from the Save the Date form", () => {
    const source = readFileSync(
      "app/admin/save-the-dates/SaveTheDateForm.tsx",
      "utf8",
    );

    expect(source).toContain("landingSubtitle: data.landingSubtitle ?? null");
    expect(source).toContain(
      "landingTranslations: data.landingTranslations ?? null",
    );
  });
});
