import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("localized invitation-owned pages", () => {
  for (const file of [
    "app/[locale]/[slug]/gifts/page.tsx",
    "app/[locale]/confirmar/[slug]/page.tsx",
  ]) {
    it(`${file} enforces invitation locales and localizes content`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("getInvitationLocaleRedirectPath");
      expect(source).toContain("localizeInvitation");
      expect(source).toContain("InvitationSearchParams");
    });
  }
});

describe("invitation language switcher placement", () => {
  for (const file of [
    "components/shared/InvitationHero.tsx",
    "components/video-entrance/VideoEntranceHero.tsx",
    "components/curtain-canva/CurtainsHero.tsx",
  ]) {
    it(`${file} mounts the shared switcher in its hero`, () => {
      expect(readFileSync(file, "utf8")).toContain(
        "<InvitationLanguageSwitcher",
      );
    });
  }

  it("covers elegant-floral through its shared InvitationHero", () => {
    expect(
      readFileSync("components/elegant-floral/ElegantFloralPage.tsx", "utf8"),
    ).toContain("<InvitationHero");
  });

  it("does not mount the switcher on the envelope", () => {
    expect(
      readFileSync("components/shared/EnvelopeCover.tsx", "utf8"),
    ).not.toContain("InvitationLanguageSwitcher");
  });

  it("keeps the switcher accessible and inside hero safe areas", () => {
    const switcher = readFileSync(
      "components/shared/InvitationLanguageSwitcher.tsx",
      "utf8",
    );
    expect(switcher).toContain("aria-current");
    expect(switcher).toContain("aria-label");
    expect(switcher).toContain("safe-area-inset-right");
    expect(switcher).toContain("safe-area-inset-top");
  });
});

describe("admin invitation language editing", () => {
  const source = readFileSync(
    "app/admin/invitations/InvitationForm.tsx",
    "utf8",
  );

  it("keeps canonical form state and submits it", () => {
    expect(source).toContain("const [sourceForm, setSourceForm]");
    expect(source).toContain("buildInvitationTranslationDraft");
    expect(source).toContain("applyInvitationTranslationDraft");
    expect(source).toContain("translations: normalized.translations ?? null");
    expect(source).toContain("body: JSON.stringify(payload)");
  });

  it("localizes preview messages and switcher callbacks", () => {
    expect(source).toContain("<NextIntlClientProvider");
    expect(source).toContain("<InvitationLanguagePreviewProvider");
    expect(source).toContain("<InvitationLanguageSettings");
  });
});

describe("translation-aware repeatable editors", () => {
  for (const file of [
    "components/admin/GiftsListEditor.tsx",
    "components/admin/BankTransferEditor.tsx",
    "components/admin/RsvpCustomFieldsBuilder.tsx",
    "components/admin/GuestGuideFormSection.tsx",
    "components/admin/PlacesFormSection.tsx",
    "components/admin/CoupleGalleryEditor.tsx",
    "components/admin/HeroTextEditor.tsx",
    "components/admin/ElegantFloralDressFields.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    it(`${file} accepts source fallback and structure lock`, () => {
      expect(source).toContain("structureLocked");
      expect(source).toContain("sourceValue");
    });
  }
});
