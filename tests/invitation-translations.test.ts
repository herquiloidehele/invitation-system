import { describe, expect, it } from "vitest";
import { duplicateForm } from "./fixtures/invitation-duplication";
import {
  applyInvitationTranslationDraft,
  buildInvitationTranslationDraft,
  getEffectiveInvitationLocales,
  localizeInvitation,
  normalizeInvitationLocales,
  normalizeInvitationTranslationIds,
  sanitizeInvitationTranslations,
  shouldShowInvitationLanguageSwitcher,
  validateInvitationLanguageSettings,
} from "@/lib/invitation-translations";

describe("invitation language settings", () => {
  it("normalizes supported locales with Portuguese first", () => {
    expect(normalizeInvitationLocales(["es", "en", "pt", "en", "fr"])).toEqual([
      "pt",
      "en",
      "es",
    ]);
    expect(normalizeInvitationLocales(undefined)).toEqual(["pt"]);
  });

  it("makes an invitation multilingual only when enabled with another locale", () => {
    expect(
      getEffectiveInvitationLocales({
        languageSwitcherEnabled: false,
        enabledLocales: ["pt", "en"],
      }),
    ).toEqual(["pt"]);
    expect(
      getEffectiveInvitationLocales({
        languageSwitcherEnabled: true,
        enabledLocales: ["pt"],
      }),
    ).toEqual(["pt"]);
    expect(
      getEffectiveInvitationLocales({
        languageSwitcherEnabled: true,
        enabledLocales: ["pt", "es"],
      }),
    ).toEqual(["pt", "es"]);
  });

  it("returns the admin API validation error for an invalid active switcher", () => {
    expect(
      validateInvitationLanguageSettings({
        languageSwitcherEnabled: true,
        enabledLocales: ["pt"],
      }),
    ).toBe("Ative pelo menos um idioma adicional.");
  });

  it("sanitizes known string leaves and removes blank or unknown values", () => {
    expect(
      sanitizeInvitationTranslations({
        fr: { quote: "Non" },
        en: {
          quote: "  Together forever  ",
          location: { name: "Venue", address: 42, unknown: "drop" },
          schedule: { ceremony: { label: "Ceremony", venue: " " } },
          unknown: "drop",
        },
      }),
    ).toEqual({
      en: {
        quote: "  Together forever  ",
        location: { name: "Venue" },
        schedule: { ceremony: { label: "Ceremony" } },
      },
    });
  });
});

describe("stable translation IDs", () => {
  it("adds unique IDs without changing existing IDs", () => {
    const ids = ["new", "new", "new", "new"];
    const invitation = duplicateForm({
      invitationType: "standard",
      schedule: [{ time: "10:00", label: "Cerimónia", venue: "Quinta" }],
      faqs: [{ question: "Quando?", answer: "Hoje" }],
      dressCode: {
        enabled: true,
        text: "Formal",
        ladies: { palette: [{ name: "Azul" }] },
      },
      coupleGallery: {
        enabled: true,
        style: "kenburns",
        images: [{ src: "/one.jpg" }],
      },
    });

    const normalized = normalizeInvitationTranslationIds(
      invitation,
      () => ids.shift()!,
    );

    expect(normalized.schedule[0].id).toBe("schedule-new");
    expect(normalized.faqs?.[0].id).toBe("faq-new");
    expect(normalized.dressCode.ladies?.palette?.[0].id).toBe(
      "dress-color-new",
    );
    expect(normalized.coupleGallery?.images[0].id).toBe("gallery-image-new");
  });

  it("preserves unique existing IDs", () => {
    const invitation = duplicateForm({
      schedule: [
        {
          id: "ceremony",
          time: "10:00",
          label: "Cerimónia",
          venue: "Quinta",
        },
      ],
    });

    expect(normalizeInvitationTranslationIds(invitation).schedule[0].id).toBe(
      "ceremony",
    );
  });
});

describe("switcher visibility", () => {
  it("requires a standard invitation and two effective locales", () => {
    const enabled = duplicateForm({
      invitationType: "standard",
      languageSwitcherEnabled: true,
      enabledLocales: ["pt", "en"],
    });
    expect(shouldShowInvitationLanguageSwitcher(enabled)).toBe(true);
    expect(
      shouldShowInvitationLanguageSwitcher({
        ...enabled,
        invitationType: "external_link",
      }),
    ).toBe(false);
  });
});

describe("invitation localization", () => {
  it("localizes scalar and ID-keyed content while preserving shared values", () => {
    const source = duplicateForm({
      invitationType: "standard",
      languageSwitcherEnabled: true,
      enabledLocales: ["pt", "en"],
      quote: "Para sempre",
      location: {
        name: "Quinta",
        address: "Lisboa",
        googleMapsUrl: "https://maps.example",
      },
      schedule: [
        {
          id: "ceremony",
          time: "15:00",
          label: "Cerimónia",
          venue: "Quinta",
          icon: "rings",
        },
      ],
      customTexts: { cta_confirmButton: "Confirmar agora" },
      translations: {
        en: {
          quote: "Forever",
          location: { name: "Estate" },
          schedule: { ceremony: { label: "Ceremony" } },
          customTexts: { cta_confirmButton: "Confirm now" },
        },
      },
    });

    const localized = localizeInvitation(source, "en");

    expect(localized.quote).toBe("Forever");
    expect(localized.location).toEqual({
      name: "Estate",
      address: "Lisboa",
      googleMapsUrl: "https://maps.example",
    });
    expect(localized.schedule[0]).toMatchObject({
      time: "15:00",
      label: "Ceremony",
      venue: "Quinta",
      icon: "rings",
    });
    expect(localized.customTexts?.cta_confirmButton).toBe("Confirm now");
    expect(source.quote).toBe("Para sempre");
  });

  it("uses Portuguese independently for each missing translation", () => {
    const source = duplicateForm({
      quote: "Para sempre",
      location: {
        name: "Quinta",
        address: "Lisboa",
        googleMapsUrl: "https://maps.example",
      },
      translations: { en: { location: { name: "Estate" } } },
    });

    const localized = localizeInvitation(source, "en");

    expect(localized.quote).toBe("Para sempre");
    expect(localized.location.address).toBe("Lisboa");
  });

  it("keeps translations attached after source reordering", () => {
    const source = duplicateForm({
      schedule: [
        { id: "dinner", time: "20:00", label: "Jantar", venue: "Salão" },
        {
          id: "ceremony",
          time: "15:00",
          label: "Cerimónia",
          venue: "Capela",
        },
      ],
      translations: {
        en: {
          schedule: {
            ceremony: { label: "Ceremony" },
            dinner: { label: "Dinner" },
          },
        },
      },
    });

    expect(
      localizeInvitation(source, "en").schedule.map((item) => item.label),
    ).toEqual(["Dinner", "Ceremony"]);
  });

  it("localizes every complex guest-content collection by stable ID", () => {
    const source = duplicateForm({
      dressCode: {
        enabled: true,
        text: "Formal",
        ladies: { palette: [{ id: "blue", name: "Azul" }] },
      },
      giftRegistry: {
        enabled: true,
        text: "Presentes",
        items: [{ id: "gift", name: "Jantar" }],
        bankTransfer: [
          {
            id: "iban",
            label: "Beneficiário",
            value: "Ana",
            copyable: false,
          },
        ],
      },
      heroTextLayer: {
        hideDefaultText: false,
        blocks: [
          {
            id: "hero-copy",
            content: "Bem-vindos",
            xPct: 50,
            yPct: 50,
            widthPct: 80,
            fontKey: "display",
            fontSizeCqw: 8,
            color: "#ffffff",
            fontWeight: 400,
            fontStyle: "normal",
            textAlign: "center",
            letterSpacing: 0,
            lineHeight: 1.2,
            shadow: true,
            z: 1,
          },
        ],
      },
      faqs: [{ id: "when", question: "Quando?", answer: "Hoje" }],
      guestGuide: {
        enabled: true,
        items: [
          {
            id: "arrive",
            label: "Chegar cedo",
            iconType: "lucide",
            iconName: "Clock",
          },
        ],
      },
      coupleGallery: {
        enabled: true,
        style: "kenburns",
        title: "Momentos",
        images: [{ id: "photo", src: "/photo.jpg", caption: "Nós" }],
      },
      places: {
        enabled: true,
        layout: "stacked",
        sections: [
          {
            id: "hotels",
            title: "Hotéis",
            items: [{ id: "hotel", title: "Hotel", description: "Perto" }],
          },
        ],
      },
      parents: {
        enabled: true,
        blessingMessage: "Com a bênção",
        inviteMessage: "Convidam",
        bridesFather: "Pai",
        bridesMother: "Mãe",
        groomsFather: "Pai",
        groomsMother: "Mãe",
      },
      ourStory: {
        enabled: true,
        title: "História",
        description: "Começou...",
      },
      rsvp: {
        enabled: true,
        customFields: [
          {
            id: "meal",
            label: "Refeição",
            type: "select",
            required: false,
            visibility: "always",
            options: [{ id: "fish", label: "Peixe" }],
          },
        ],
      },
      translations: {
        en: {
          dressCode: {
            text: "Formal attire",
            palette: { blue: { name: "Blue" } },
          },
          giftRegistry: {
            text: "Gifts",
            items: { gift: { name: "Dinner" } },
            bankTransfer: { iban: { label: "Beneficiary" } },
          },
          heroTextBlocks: { "hero-copy": { content: "Welcome" } },
          faqs: { when: { question: "When?", answer: "Today" } },
          guestGuideItems: { arrive: { label: "Arrive early" } },
          coupleGallery: {
            title: "Moments",
            images: { photo: { caption: "Us" } },
          },
          places: {
            sections: {
              hotels: {
                title: "Hotels",
                items: {
                  hotel: { title: "Hotel", description: "Nearby" },
                },
              },
            },
          },
          parents: {
            blessingMessage: "With our parents' blessing",
            inviteMessage: "Invite you",
          },
          ourStory: { title: "Our story", description: "It began..." },
          rsvpCustomFields: {
            meal: { label: "Meal", options: { fish: { label: "Fish" } } },
          },
        },
      },
    });

    const localized = localizeInvitation(source, "en");

    expect(localized.dressCode).toMatchObject({
      text: "Formal attire",
      ladies: { palette: [{ id: "blue", name: "Blue" }] },
    });
    expect(localized.giftRegistry.items?.[0].name).toBe("Dinner");
    expect(localized.giftRegistry.bankTransfer?.[0].label).toBe("Beneficiary");
    expect(localized.heroTextLayer?.blocks[0].content).toBe("Welcome");
    expect(localized.faqs?.[0]).toMatchObject({
      question: "When?",
      answer: "Today",
    });
    expect(localized.guestGuide?.items[0].label).toBe("Arrive early");
    expect(localized.coupleGallery).toMatchObject({
      title: "Moments",
      images: [{ id: "photo", caption: "Us" }],
    });
    expect(localized.places?.sections[0]).toMatchObject({
      title: "Hotels",
      items: [{ id: "hotel", description: "Nearby" }],
    });
    expect(localized.parents).toMatchObject({
      blessingMessage: "With our parents' blessing",
      inviteMessage: "Invite you",
    });
    expect(localized.ourStory).toMatchObject({
      title: "Our story",
      description: "It began...",
    });
    expect(localized.rsvp.customFields?.[0]).toMatchObject({
      label: "Meal",
      options: [{ id: "fish", label: "Fish" }],
    });
  });
});

describe("invitation translation drafts", () => {
  it("builds a blank translation draft but a fallback-filled preview", () => {
    const source = duplicateForm({
      quote: "Para sempre",
      schedule: [
        {
          id: "ceremony",
          time: "15:00",
          label: "Cerimónia",
          venue: "Capela",
        },
      ],
      translations: { en: { quote: "Forever" } },
    });

    const draft = buildInvitationTranslationDraft(source, "en");

    expect(draft.quote).toBe("Forever");
    expect(draft.schedule[0].label).toBe("");
    expect(draft.schedule[0].time).toBe("15:00");
    expect(localizeInvitation(source, "en").schedule[0].label).toBe(
      "Cerimónia",
    );
  });

  it("writes draft text to the overlay and shared values to the source", () => {
    const source = duplicateForm({
      quote: "Para sempre",
      location: {
        name: "Quinta",
        address: "Lisboa",
        googleMapsUrl: "https://maps.old",
      },
    });
    const draft = buildInvitationTranslationDraft(source, "en");
    draft.quote = "Forever";
    draft.location.name = "Estate";
    draft.location.googleMapsUrl = "https://maps.new";

    const saved = applyInvitationTranslationDraft(source, "en", draft);

    expect(saved.quote).toBe("Para sempre");
    expect(saved.location.name).toBe("Quinta");
    expect(saved.location.googleMapsUrl).toBe("https://maps.new");
    expect(saved.translations?.en).toMatchObject({
      quote: "Forever",
      location: { name: "Estate" },
    });
  });

  it("does not allow translation drafts to reorder or add source structures", () => {
    const source = duplicateForm({
      schedule: [
        { id: "first", time: "10:00", label: "Primeiro", venue: "A" },
        { id: "second", time: "11:00", label: "Segundo", venue: "B" },
      ],
    });
    const draft = buildInvitationTranslationDraft(source, "en");
    draft.schedule = [
      { ...draft.schedule[1], label: "Second" },
      {
        id: "injected",
        time: "12:00",
        label: "Injected",
        venue: "C",
      },
      { ...draft.schedule[0], label: "First" },
    ];

    const saved = applyInvitationTranslationDraft(source, "en", draft);

    expect(saved.schedule.map((item) => item.id)).toEqual(["first", "second"]);
    expect(
      localizeInvitation(saved, "en").schedule.map((item) => item.label),
    ).toEqual(["First", "Second"]);
  });
});
