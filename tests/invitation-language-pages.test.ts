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
    // The draft machinery itself lives in the shared hook; the form only has to
    // consume it and post the canonical record rather than the locale draft.
    expect(source).toContain("useInvitationTranslationDraft");
    expect(source).toContain("sourceForm");
    expect(source).toContain("translations: normalized.translations ?? null");
    expect(source).toContain("body: JSON.stringify(payload)");
  });

  it("delegates the draft projection to the shared hook", () => {
    const hook = readFileSync(
      "hooks/use-invitation-translation-draft.ts",
      "utf8",
    );
    expect(hook).toContain("buildInvitationTranslationDraft");
    expect(hook).toContain("applyInvitationTranslationDraft");
  });

  it("localizes preview messages and switcher callbacks", () => {
    expect(source).toContain("<NextIntlClientProvider");
    expect(source).toContain("<InvitationLanguagePreviewProvider");
    expect(source).toContain("<InvitationLanguageSettings");
  });

  it("renders language settings as the first shared accordion item", () => {
    const languageItem = source.indexOf('value="languages"');
    const firstExistingItem = source.indexOf('<AccordionItem value="couple"');

    expect(languageItem).toBeGreaterThan(-1);
    expect(languageItem).toBeLessThan(firstExistingItem);
    expect(source).toMatch(
      /<AccordionTrigger className="text-sm font-medium">\s*Idiomas\s*<\/AccordionTrigger>/,
    );
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

describe("translation gating uses the shared predicate", () => {
  for (const file of [
    "app/[locale]/[slug]/page.tsx",
    "app/[locale]/confirmar/[slug]/page.tsx",
    "app/[locale]/[slug]/gifts/page.tsx",
    "lib/invitation-language-routing.ts",
  ]) {
    it(`${file} delegates to supportsInvitationTranslations`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("supportsInvitationTranslations");
      expect(source).not.toContain('invitationType === "standard"');
      expect(source).not.toContain('invitationType !== "standard"');
    });
  }
});

describe("external pages carry no hardcoded Portuguese chrome", () => {
  const cases: Array<[string, string]> = [
    ["components/shared/RevealableExternalSections.tsx", ">RSVP<"],
    ["components/curtain-canva/CanvaEmbed.tsx", '"Convite"'],
    ["components/shared/ExternalLinkPage.tsx", '"Convite externo"'],
    ["components/curtain-canva/ScratchDateReveal.tsx", "Raspe para revelar"],
    ["components/curtain-canva/CurtainsHero.tsx", '"Scroll to next section"'],
    [
      "components/video-entrance/VideoEntranceHero.tsx",
      '"Scroll to next section"',
    ],
  ];

  for (const [file, literal] of cases) {
    it(`${file} no longer contains ${literal}`, () => {
      expect(readFileSync(file, "utf8")).not.toContain(literal);
    });
  }
});

describe("admin translation draft state is shared", () => {
  for (const file of [
    "app/admin/invitations/InvitationForm.tsx",
    "app/admin/invitations/ExternalInvitationForm.tsx",
  ]) {
    it(`${file} consumes useInvitationTranslationDraft`, () => {
      expect(readFileSync(file, "utf8")).toContain(
        "useInvitationTranslationDraft",
      );
    });
  }

  it("keeps the stale-closure guard in the hook", () => {
    const source = readFileSync(
      "hooks/use-invitation-translation-draft.ts",
      "utf8",
    );
    expect(source).toContain("activeLocaleRef");
    expect(source).toContain("supportsInvitationTranslations");
  });
});

describe("external admin form language settings", () => {
  const source = readFileSync(
    "app/admin/invitations/ExternalInvitationForm.tsx",
    "utf8",
  );

  it("renders the Idiomas accordion", () => {
    expect(source).toContain('value="languages"');
    expect(source).toContain("<InvitationLanguageSettings");
  });

  it("drives the active locale from the shared hook", () => {
    expect(source).toContain("setActiveLocale");
    expect(source).toContain("normalizeInvitationLocales");
  });

  it("renders the custom texts editor", () => {
    expect(source).toContain('value="customTexts"');
    expect(source).toContain("CUSTOM_TEXT_GROUPS");
  });

  it("locks structural edits outside Portuguese", () => {
    expect(source).toContain("structureLocked");
  });

  it("posts the canonical record, never the locale draft", () => {
    expect(source).toContain("normalizeInvitationTranslationIds(sourceForm)");
    expect(source).toContain("validateInvitationLanguageSettings(sourceForm)");
    expect(source).not.toContain("JSON.stringify(form)");
  });

  it("wraps the preview in a locale provider", () => {
    expect(source).toContain("NextIntlClientProvider");
    expect(source).toContain("InvitationLanguagePreviewProvider");
  });
});

// A translator editing in en/es sees an empty input; without the Portuguese
// value as its placeholder they are translating blind. This is the guard that
// would have caught the hero-text case.
describe("external form shows the Portuguese source while translating", () => {
  const source = readFileSync(
    "app/admin/invitations/ExternalInvitationForm.tsx",
    "utf8",
  );

  // Prettier wraps long calls across lines, so compare whitespace-insensitively.
  const flat = source.replace(/\s+/g, "");

  function count(needle: string): number {
    return flat.split(needle.replace(/\s+/g, "")).length - 1;
  }

  // [label, how the draft value is bound, the matching canonical reference]
  const translatable: Array<[string, string, string]> = [
    ["quote", "value={form.quote", "sourcePlaceholder(sourceForm.quote"],
    ["heroTopText", "value={form.heroTopText", "sourcePlaceholder(sourceForm.heroTopText"],
    ["parents.blessingMessage", "form.parents.blessingMessage ??", "sourcePlaceholder(sourceForm.parents?.blessingMessage"],
    ["parents.inviteMessage", "form.parents.inviteMessage ??", "sourcePlaceholder(sourceForm.parents?.inviteMessage"],
    ["countdown.title", "form.countdown.title ??", "sourcePlaceholder(sourceForm.countdown?.title"],
    ["countdown.subtitle", "form.countdown.subtitle ??", "sourcePlaceholder(sourceForm.countdown?.subtitle"],
    ["countdown.daysLabel", "form.countdown.daysLabel ??", "sourcePlaceholder(sourceForm.countdown?.daysLabel"],
    ["countdown.hoursLabel", "form.countdown.hoursLabel ??", "sourcePlaceholder(sourceForm.countdown?.hoursLabel"],
    ["countdown.minutesLabel", "form.countdown.minutesLabel ??", "sourcePlaceholder(sourceForm.countdown?.minutesLabel"],
    ["countdown.secondsLabel", "form.countdown.secondsLabel ??", "sourcePlaceholder(sourceForm.countdown?.secondsLabel"],
    ["giftRegistry.text", "value={form.giftRegistry.text}", "sourcePlaceholder(sourceForm.giftRegistry.text,"],
    ["giftRegistry.bankTransferText", "form.giftRegistry.bankTransferText ??", "sourcePlaceholder(sourceForm.giftRegistry.bankTransferText"],
    ["faqs[].question", "value={faq.question}", "sourcePlaceholder(sourceForm.faqs?.[index]?.question"],
    ["faqs[].answer", "value={faq.answer}", "sourcePlaceholder(sourceForm.faqs?.[index]?.answer"],
  ];

  for (const [label, binding, reference] of translatable) {
    it(`${label} offers the Portuguese value as its placeholder`, () => {
      const bindings = count(binding);
      expect(bindings).toBeGreaterThan(0);
      // One canonical placeholder per bound input, so no variant is missed.
      expect(count(reference)).toBe(bindings);
    });
  }
});
