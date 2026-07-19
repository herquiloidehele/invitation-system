# Standard Invitation Language Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in Portuguese, English, and Spanish content editing and a hero-anchored guest language switcher to standard invitations.

**Architecture:** Portuguese remains the canonical invitation record. English and Spanish are sparse JSON overlays merged through one pure localization domain; the admin uses a translation draft derived from the same domain, while public routes enforce each invitation's effective locale list before rendering. A shared switcher component is mounted by every standard hero renderer and reuses the existing `section=hero` entry behavior to avoid replaying the envelope.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl 4, Prisma 7/PostgreSQL JSONB and text arrays, Vitest, Tailwind CSS 4, shadcn/ui.

## Global Constraints

- Supported locales are exactly `pt`, `en`, and `es`.
- Portuguese is the canonical source language and cannot be disabled.
- Missing or blank English/Spanish content falls back to Portuguese per field.
- Do not add automatic or machine translation.
- Do not add arbitrary locales, translator accounts, review states, or approval workflows.
- Locale-specific media, styling, dates, times, URLs, phone numbers, payment values, IDs, and list ordering are out of scope.
- `standard` means `invitationType === "standard"`, including theme-specific renderers.
- External-link, external-video, and Save the Date products remain unchanged.
- The guest switcher renders inside the hero's top-right corner and never on the unopened envelope.
- Switching language preserves all query parameters and sets `section=hero`.
- Tests run in Vitest's Node environment; do not introduce DOM-dependent tests.
- Always import the Prisma singleton from `@/lib/db`; never instantiate `PrismaClient`.
- Use `npm run build`; never invoke `next build` directly.

---

## File Structure

### New files

- `lib/invitation-translations.ts` — locale settings, overlay sanitization, ID normalization, public localization, and admin translation-draft transforms.
- `lib/invitation-language-routing.ts` — pure query serialization, locale switch URLs, and disabled-locale redirect decisions.
- `components/shared/InvitationLanguageSwitcher.tsx` — accessible hero switcher plus admin-preview callback context.
- `components/admin/InvitationLanguageSettings.tsx` — activation, enabled-locale controls, and form-level editing-language selector.
- `i18n/client-messages.ts` — explicit client-side message lookup for the admin preview.
- `tests/invitation-translations.test.ts` — domain, sanitization, ID, fallback, and editor-draft tests.
- `tests/invitation-language-routing.test.ts` — redirect and switch-link behavior.
- `tests/invitation-language-persistence.test.ts` — migration, create/update, hydration, and duplication coverage.
- `tests/invitation-language-pages.test.ts` — public route, metadata, related-page, hero, envelope, and admin wiring contracts.
- `prisma/migrations/20260719190000_add_invitation_translations/migration.sql` — additive invitation locale columns.

### Existing files with focused changes

- `prisma/schema.prisma` — add the three persisted fields.
- `lib/types.ts` — stable IDs, overlay types, and `InvitationData` locale fields.
- `lib/invitation-create-data.ts` — normalize and persist locale data.
- `lib/invitation-admin-initial-data.ts` — hydrate locale data.
- `lib/invitations.ts` — expose locale data to public routes.
- `app/api/admin/invitations/route.ts` — reject invalid create settings.
- `app/api/admin/invitations/[id]/route.ts` — validate and persist update settings.
- `tests/fixtures/invitation-duplication.ts` — complete the Prisma-row fixture.
- `tests/invitation-create-data.test.ts`, `tests/invitation-admin-initial-data.test.ts`, `tests/invitation-duplication.test.ts` — persistence round trips.
- `lib/seo.ts` — invitation-specific language alternates.
- `app/[locale]/[slug]/page.tsx` — locale enforcement, localization, metadata, and JSON-LD.
- `app/[locale]/[slug]/gifts/page.tsx` — locale enforcement and localized gift content.
- `app/[locale]/confirmar/[slug]/page.tsx` — locale enforcement and localized RSVP content.
- `components/shared/InvitationHero.tsx` — default hero switcher placement.
- `components/elegant-floral/ElegantFloralPage.tsx` — elegant-floral hero placement.
- `components/video-entrance/VideoEntranceHero.tsx` — video-entrance hero placement.
- `components/curtain-canva/CurtainsHero.tsx` — curtain hero placement.
- `app/admin/invitations/InvitationForm.tsx` — canonical/draft state, settings UI, locale preview, placeholders, and structural locks.
- `components/admin/GiftsListEditor.tsx`
- `components/admin/BankTransferEditor.tsx`
- `components/admin/RsvpCustomFieldsBuilder.tsx`
- `components/admin/GuestGuideFormSection.tsx`
- `components/admin/PlacesFormSection.tsx`
- `components/admin/CoupleGalleryEditor.tsx`
- `components/admin/HeroTextEditor.tsx`
- `components/admin/ElegantFloralDressFields.tsx`

---

### Task 1: Translation contracts, locale policy, sanitization, and stable IDs

**Files:**
- Create: `lib/invitation-translations.ts`
- Create: `tests/invitation-translations.test.ts`
- Modify: `lib/types.ts:92-105`
- Modify: `lib/types.ts:380-445`
- Modify: `lib/types.ts:907-1160`

**Interfaces:**
- Consumes: `AppLocale` from `i18n/locales.ts`, `InvitationData` and content types from `lib/types.ts`.
- Produces:
  - `TranslationLocale = "en" | "es"`
  - `InvitationTranslations`
  - `InvitationTranslationOverlay`
  - `normalizeInvitationLocales(value: unknown): AppLocale[]`
  - `getEffectiveInvitationLocales(input: InvitationLanguageSettings): AppLocale[]`
  - `validateInvitationLanguageSettings(input: InvitationLanguageSettings): string | null`
  - `sanitizeInvitationTranslations(value: unknown): InvitationTranslations | undefined`
  - `normalizeTranslationIdFields(input, createId?)`
  - `normalizeInvitationTranslationIds(invitation: InvitationData, createId?: () => string): InvitationData`
  - `shouldShowInvitationLanguageSwitcher(invitation: InvitationData): boolean`

- [ ] **Step 1: Add failing locale-policy, sanitizer, and ID tests**

Create `tests/invitation-translations.test.ts` with concrete coverage:

```ts
import { describe, expect, it } from "vitest";
import { duplicateForm } from "./fixtures/invitation-duplication";
import {
  getEffectiveInvitationLocales,
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
    expect(normalized.dressCode.ladies?.palette?.[0].id).toBe("color-new");
    expect(normalized.coupleGallery?.images[0].id).toBe("photo-new");
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
```

- [ ] **Step 2: Run the test to confirm the module is missing**

Run:

```bash
npx vitest run tests/invitation-translations.test.ts
```

Expected: FAIL because `@/lib/invitation-translations` and the new type fields do not exist.

- [ ] **Step 3: Add stable IDs and the complete overlay contract**

In `lib/types.ts`, add optional IDs without breaking legacy JSON:

```ts
export interface ScheduleEvent {
  id?: string;
  time: string;
  label: string;
  venue: string;
  icon?: ScheduleIcon;
  iconUrl?: string;
}

export interface DressColor {
  id?: string;
  name: string;
  hex?: string;
}

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

export interface CoupleGalleryImage {
  id?: string;
  src: string;
  caption?: string;
  positionX?: number;
  positionY?: number;
  zoom?: number;
}
```

Add these translation types immediately before `InvitationData`:

```ts
export type TranslationLocale = "en" | "es";

export interface InvitationTranslationOverlay {
  quote?: string;
  heroTopText?: string;
  location?: { name?: string; address?: string };
  location2?: { name?: string; address?: string };
  schedule?: Record<string, { label?: string; venue?: string }>;
  dressCode?: {
    text?: string;
    title?: string;
    intro?: string;
    ladies?: { label?: string; note?: string };
    gentlemen?: { label?: string; note?: string };
    reservedNote?: string;
    palette?: Record<string, { name?: string }>;
  };
  giftRegistry?: {
    text?: string;
    bankTransferText?: string;
    items?: Record<string, { name?: string }>;
    bankTransfer?: Record<string, { label?: string }>;
  };
  heroTextBlocks?: Record<string, { content?: string }>;
  faqs?: Record<string, { question?: string; answer?: string }>;
  guestGuideItems?: Record<string, { label?: string }>;
  coupleGallery?: {
    title?: string;
    images?: Record<string, { caption?: string }>;
  };
  places?: {
    sections?: Record<
      string,
      {
        title?: string;
        items?: Record<string, { title?: string; description?: string }>;
      }
    >;
  };
  parents?: { blessingMessage?: string; inviteMessage?: string };
  ourStory?: { title?: string; description?: string };
  rsvpCustomFields?: Record<
    string,
    {
      label?: string;
      options?: Record<string, { label?: string }>;
    }
  >;
  customTexts?: CustomTexts;
}

export type InvitationTranslations = Partial<
  Record<TranslationLocale, InvitationTranslationOverlay>
>;
```

Add the persistence-facing properties to `InvitationData` after `customTexts`:

```ts
  languageSwitcherEnabled?: boolean;
  enabledLocales?: import("@/i18n/locales").AppLocale[];
  translations?: InvitationTranslations;
```

- [ ] **Step 4: Implement locale normalization, validation, and visibility**

Create `lib/invitation-translations.ts` with these exact public types and rules:

```ts
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/locales";
import type {
  InvitationData,
  InvitationTranslations,
  TranslationLocale,
} from "@/lib/types";

export type InvitationLanguageSettings = Pick<
  InvitationData,
  "languageSwitcherEnabled" | "enabledLocales"
>;

export function normalizeInvitationLocales(value: unknown): AppLocale[] {
  const selected = new Set<AppLocale>([DEFAULT_LOCALE]);
  if (Array.isArray(value)) {
    for (const locale of value) {
      if (isSupportedLocale(locale)) selected.add(locale);
    }
  }
  return SUPPORTED_LOCALES.filter((locale) => selected.has(locale));
}

export function getEffectiveInvitationLocales(
  input: InvitationLanguageSettings,
): AppLocale[] {
  const locales = normalizeInvitationLocales(input.enabledLocales);
  return input.languageSwitcherEnabled === true && locales.length > 1
    ? locales
    : [DEFAULT_LOCALE];
}

export function validateInvitationLanguageSettings(
  input: InvitationLanguageSettings,
): string | null {
  if (
    input.languageSwitcherEnabled === true &&
    normalizeInvitationLocales(input.enabledLocales).length < 2
  ) {
    return "Ative pelo menos um idioma adicional.";
  }
  return null;
}

export function shouldShowInvitationLanguageSwitcher(
  invitation: InvitationData,
): boolean {
  return (
    invitation.invitationType === "standard" &&
    getEffectiveInvitationLocales(invitation).length > 1
  );
}

export function isTranslationLocale(
  locale: AppLocale,
): locale is TranslationLocale {
  return locale === "en" || locale === "es";
}
```

- [ ] **Step 5: Implement an explicit allow-list sanitizer**

Use small `readString`, `readObject`, `readRecord`, and `compact` helpers. A string is retained when `value.trim().length > 0`, but its original non-empty value is returned. Encode every field in `InvitationTranslationOverlay`; do not spread caller objects. The top-level function must be:

```ts
export function sanitizeInvitationTranslations(
  value: unknown,
): InvitationTranslations | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const result: InvitationTranslations = {};
  for (const locale of ["en", "es"] as const) {
    const overlay = sanitizeOverlay(input[locale]);
    if (overlay) result[locale] = overlay;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
```

`sanitizeOverlay` must explicitly copy `quote`, `heroTopText`, the two
locations, schedule, dress code, gift registry, hero blocks, FAQs, guest guide,
gallery, places, parents, story, RSVP custom fields/options, and only keys from
`CUSTOM_TEXT_GROUPS.flatMap(group => group.fields.map(field => field.key))`.

- [ ] **Step 6: Implement stable-ID normalization**

Clone only the arrays that need IDs and preserve all unrelated references:

```ts
export function normalizeTranslationIdFields(
  input: TranslationIdFields,
  createId: () => string = () => crypto.randomUUID(),
): TranslationIdFields {
  const used = new Set<string>();
  const id = (prefix: string, current?: string) => {
    if (current && !used.has(current)) {
      used.add(current);
      return current;
    }
    let next = `${prefix}-${createId()}`;
    while (used.has(next)) next = `${prefix}-${createId()}`;
    used.add(next);
    return next;
  };

  return {
    ...input,
    schedule: input.schedule?.map((item) => ({
      ...item,
      id: id("schedule", item.id),
    })),
    faqs: input.faqs?.map((item) => ({
      ...item,
      id: id("faq", item.id),
    })),
    dressCode: input.dressCode
      ? {
          ...input.dressCode,
          ladies: input.dressCode.ladies
            ? {
                ...input.dressCode.ladies,
                palette: input.dressCode.ladies.palette?.map((item) => ({
                  ...item,
                  id: id("dress-color", item.id),
                })),
              }
            : undefined,
        }
      : undefined,
    coupleGallery: input.coupleGallery
      ? {
          ...input.coupleGallery,
          images: input.coupleGallery.images.map((item) => ({
            ...item,
            id: id("gallery-image", item.id),
          })),
        }
      : undefined,
  };
}

export function normalizeInvitationTranslationIds(
  invitation: InvitationData,
  createId?: () => string,
): InvitationData {
  return {
    ...invitation,
    ...normalizeTranslationIdFields(invitation, createId),
  };
}
```

Define the helper input type directly above the function:

```ts
type TranslationIdFields = Partial<
  Pick<InvitationData, "schedule" | "faqs" | "dressCode" | "coupleGallery">
>;
```

- [ ] **Step 7: Run the focused tests**

Run:

```bash
npx vitest run tests/invitation-translations.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the domain contract**

```bash
git add lib/types.ts lib/invitation-translations.ts tests/invitation-translations.test.ts
git commit -m "feat: add invitation translation domain"
```

---

### Task 2: Public localization and admin translation drafts

**Files:**
- Modify: `lib/invitation-translations.ts`
- Modify: `tests/invitation-translations.test.ts`

**Interfaces:**
- Consumes: Task 1's overlay types, sanitizer, stable IDs, and locale guards.
- Produces:
  - `localizeInvitation(source: InvitationData, locale: AppLocale): InvitationData`
  - `buildInvitationTranslationDraft(source: InvitationData, locale: AppLocale): InvitationData`
  - `applyInvitationTranslationDraft(source: InvitationData, locale: AppLocale, draft: InvitationData): InvitationData`
  - `getInvitationTranslationOverlay(source: InvitationData, locale: AppLocale): InvitationTranslationOverlay | undefined`

- [ ] **Step 1: Add failing localization tests**

Append tests that exercise scalar, nested, repeated, custom-text, fallback, shared-value, reorder, and immutability behavior:

```ts
import {
  applyInvitationTranslationDraft,
  buildInvitationTranslationDraft,
  localizeInvitation,
} from "@/lib/invitation-translations";

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
      { id: "ceremony", time: "15:00", label: "Cerimónia", venue: "Capela" },
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
  expect(localizeInvitation(source, "en").schedule.map((item) => item.label)).toEqual([
    "Dinner",
    "Ceremony",
  ]);
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
        { id: "iban", label: "Beneficiário", value: "Ana", copyable: false },
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
        { id: "arrive", label: "Chegar cedo", iconType: "lucide", iconName: "Clock" },
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
    ourStory: { enabled: true, title: "História", description: "Começou..." },
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
        dressCode: { text: "Formal attire", palette: { blue: { name: "Blue" } } },
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
              items: { hotel: { title: "Hotel", description: "Nearby" } },
            },
          },
        },
        parents: { blessingMessage: "With our parents' blessing", inviteMessage: "Invite you" },
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
  expect(localized.faqs?.[0]).toMatchObject({ question: "When?", answer: "Today" });
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
```

- [ ] **Step 2: Add failing admin-draft tests**

Append:

```ts
it("builds a blank translation draft but a fallback-filled preview", () => {
  const source = duplicateForm({
    quote: "Para sempre",
    schedule: [
      { id: "ceremony", time: "15:00", label: "Cerimónia", venue: "Capela" },
    ],
    translations: { en: { quote: "Forever" } },
  });

  const draft = buildInvitationTranslationDraft(source, "en");
  expect(draft.quote).toBe("Forever");
  expect(draft.schedule[0].label).toBe("");
  expect(draft.schedule[0].time).toBe("15:00");
  expect(localizeInvitation(source, "en").schedule[0].label).toBe("Cerimónia");
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
```

- [ ] **Step 3: Run the tests to verify missing exports**

Run:

```bash
npx vitest run tests/invitation-translations.test.ts
```

Expected: FAIL because the localization and draft functions are not exported.

- [ ] **Step 4: Implement public localization**

Implement explicit, non-mutating mergers. Use source arrays as the structural
authority and look up overlay records by stable ID:

```ts
export function getInvitationTranslationOverlay(
  source: InvitationData,
  locale: AppLocale,
): InvitationTranslationOverlay | undefined {
  return isTranslationLocale(locale)
    ? sanitizeInvitationTranslations(source.translations)?.[locale]
    : undefined;
}

export function localizeInvitation(
  source: InvitationData,
  locale: AppLocale,
): InvitationData {
  const overlay = getInvitationTranslationOverlay(source, locale);
  if (!overlay) return source;

  return {
    ...source,
    quote: overlay.quote ?? source.quote,
    heroTopText: overlay.heroTopText ?? source.heroTopText,
    location: mergeLocation(source.location, overlay.location),
    location2: source.location2
      ? mergeLocation(source.location2, overlay.location2)
      : undefined,
    schedule: source.schedule.map((item) =>
      mergeSchedule(item, item.id ? overlay.schedule?.[item.id] : undefined),
    ),
    dressCode: mergeDressCode(source.dressCode, overlay.dressCode),
    giftRegistry: mergeGiftRegistry(
      source.giftRegistry,
      overlay.giftRegistry,
    ),
    heroTextLayer: mergeHeroTextLayer(
      source.heroTextLayer,
      overlay.heroTextBlocks,
    ),
    faqs: mergeFaqs(source.faqs, overlay.faqs),
    guestGuide: mergeGuestGuide(source.guestGuide, overlay.guestGuideItems),
    coupleGallery: mergeGallery(source.coupleGallery, overlay.coupleGallery),
    places: mergePlaces(source.places, overlay.places),
    parents: mergeParents(source.parents, overlay.parents),
    ourStory: mergeOurStory(source.ourStory, overlay.ourStory),
    rsvp: mergeRsvp(source.rsvp, overlay.rsvpCustomFields),
    customTexts: { ...source.customTexts, ...overlay.customTexts },
  };
}
```

Implement each named helper in the same file. Every helper:

- returns `undefined` when its source section is absent;
- reads arrays from the Portuguese source;
- merges translated string leaves with `??`;
- keeps IDs, ordering, booleans, URLs, styles, media, times, prices, values, and
  all other shared properties from the source.

- [ ] **Step 5: Implement raw translation drafts**

`buildInvitationTranslationDraft` uses the same traversal but replaces every
translatable source string with `overlayValue ?? ""`. It leaves shared values
untouched. For Portuguese it returns the source object:

```ts
export function buildInvitationTranslationDraft(
  source: InvitationData,
  locale: AppLocale,
): InvitationData {
  if (!isTranslationLocale(locale)) return source;
  const overlay = getInvitationTranslationOverlay(source, locale);
  return buildDraftFromOverlay(source, overlay);
}
```

`buildDraftFromOverlay` must cover the exact same translation leaves as
`localizeInvitation`; this symmetry is required so no guest-visible field is
renderable but uneditable.

- [ ] **Step 6: Implement draft persistence**

Implement two explicit internal transforms:

1. `restorePortugueseText(source, draft)` copies shared values from the draft
   while restoring every translatable string from `source`. Repeated items are
   matched by ID and retain the source ordering and membership.
2. `extractOverlay(draft)` collects every non-blank translatable string into an
   `InvitationTranslationOverlay`, keyed by stable IDs.

Then expose:

```ts
export function applyInvitationTranslationDraft(
  source: InvitationData,
  locale: AppLocale,
  draft: InvitationData,
): InvitationData {
  if (!isTranslationLocale(locale)) {
    return normalizeInvitationTranslationIds(draft);
  }

  const canonical = restorePortugueseText(source, draft);
  const translations = sanitizeInvitationTranslations({
    ...canonical.translations,
    [locale]: extractOverlay(draft),
  });

  return normalizeInvitationTranslationIds({
    ...canonical,
    translations,
  });
}
```

Structural membership for schedules, FAQs, palettes, gallery images, gifts,
bank rows, guest-guide items, place sections/items, hero blocks, and RSVP
fields/options always comes from `source` in translation mode.

- [ ] **Step 7: Run the full domain test**

Run:

```bash
npx vitest run tests/invitation-translations.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit localization and editor transforms**

```bash
git add lib/invitation-translations.ts tests/invitation-translations.test.ts
git commit -m "feat: localize invitation content"
```

---

### Task 3: Database migration and persistence round trips

**Files:**
- Create: `prisma/migrations/20260719190000_add_invitation_translations/migration.sql`
- Create: `tests/invitation-language-persistence.test.ts`
- Modify: `prisma/schema.prisma:118-127`
- Modify: `lib/invitation-create-data.ts:10-90`
- Modify: `lib/invitation-admin-initial-data.ts:30-185`
- Modify: `lib/invitations.ts:20-175`
- Modify: `app/api/admin/invitations/route.ts:12-55`
- Modify: `app/api/admin/invitations/[id]/route.ts:55-326`
- Modify: `prisma/seed.ts:299-370`
- Modify: `tests/fixtures/invitation-duplication.ts:46-169`
- Modify: `tests/invitation-create-data.test.ts`
- Modify: `tests/invitation-admin-initial-data.test.ts`
- Modify: `tests/invitation-duplication.test.ts`

**Interfaces:**
- Consumes: Task 1 validation/sanitization/ID normalization and Task 2 canonical data.
- Produces: persisted Prisma fields available in public and admin mappers.

- [ ] **Step 1: Add failing persistence tests**

Create `tests/invitation-language-persistence.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildInvitationCreateData } from "@/lib/invitation-create-data";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import {
  duplicateForm,
  sourceInvitationRow,
} from "./fixtures/invitation-duplication";

describe("invitation language persistence", () => {
  it("writes normalized language settings on create", () => {
    const body = duplicateForm({
      invitationType: "standard",
      languageSwitcherEnabled: true,
      enabledLocales: ["es", "pt", "en", "en"],
      translations: { en: { quote: "Forever" } },
    });
    const data = buildInvitationCreateData(body, "theme-copy");
    expect(data.languageSwitcherEnabled).toBe(true);
    expect(data.enabledLocales).toEqual(["pt", "en", "es"]);
    expect(data.translations).toEqual({ en: { quote: "Forever" } });
  });

  it("hydrates settings and translations for editing and duplication", () => {
    const initial = toAdminInvitationInitialData({
      ...sourceInvitationRow,
      languageSwitcherEnabled: true,
      enabledLocales: ["pt", "en"],
      translations: { en: { quote: "Forever" } },
    });
    expect(initial).toMatchObject({
      languageSwitcherEnabled: true,
      enabledLocales: ["pt", "en"],
      translations: { en: { quote: "Forever" } },
    });
  });

  it("declares additive database fields and update-route persistence", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const migration = readFileSync(
      "prisma/migrations/20260719190000_add_invitation_translations/migration.sql",
      "utf8",
    );
    const updateRoute = readFileSync(
      "app/api/admin/invitations/[id]/route.ts",
      "utf8",
    );
    const publicMapper = readFileSync("lib/invitations.ts", "utf8");
    const seed = readFileSync("prisma/seed.ts", "utf8");
    expect(schema).toContain("languageSwitcherEnabled Boolean");
    expect(schema).toContain('enabledLocales String[] @default(["pt"])');
    expect(schema).toContain("translations Json?");
    expect(migration).toContain('"enabledLocales" TEXT[]');
    expect(updateRoute).toContain("sanitizeInvitationTranslations");
    expect(updateRoute).toContain("validateInvitationLanguageSettings");
    expect(publicMapper).toContain("languageSwitcherEnabled:");
    expect(publicMapper).toContain("enabledLocales:");
    expect(publicMapper).toContain("translations:");
    expect(seed).toContain("languageSwitcherEnabled:");
    expect(seed).toContain("enabledLocales:");
    expect(seed).toContain("translations:");
  });
});
```

- [ ] **Step 2: Run the persistence test to verify failure**

Run:

```bash
npx vitest run tests/invitation-language-persistence.test.ts
```

Expected: FAIL because the schema, migration, mapper fields, and fixture fields
are missing.

- [ ] **Step 3: Add the Prisma fields and additive migration**

Add to `Invitation` after `customTexts`:

```prisma
  languageSwitcherEnabled Boolean  @default(false)
  enabledLocales           String[] @default(["pt"])
  translations             Json?
```

Create the migration:

```sql
ALTER TABLE "Invitation"
ADD COLUMN "languageSwitcherEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "enabledLocales" TEXT[] NOT NULL DEFAULT ARRAY['pt']::TEXT[],
ADD COLUMN "translations" JSONB;
```

Regenerate the client:

```bash
npm run db:generate
```

Expected: Prisma Client generation succeeds in `lib/generated/prisma/`.

- [ ] **Step 4: Persist normalized fields on create**

At the start of `buildInvitationCreateData`, normalize IDs once:

```ts
const invitation = normalizeInvitationTranslationIds(body);
const enabledLocales = normalizeInvitationLocales(invitation.enabledLocales);
```

Use `invitation` instead of `body` for schedule, FAQs, dress code, gallery, and
all other existing mappings. Add:

```ts
languageSwitcherEnabled: invitation.languageSwitcherEnabled === true,
enabledLocales,
translations: sanitizeJsonField(
  sanitizeInvitationTranslations(invitation.translations),
  null,
),
```

- [ ] **Step 5: Validate the create API before database work**

In `POST`, after parsing the body:

```ts
const languageError = validateInvitationLanguageSettings(body);
if (languageError) {
  return NextResponse.json({ error: languageError }, { status: 400 });
}
```

Import the validator from `@/lib/invitation-translations`.

- [ ] **Step 6: Validate and persist updates**

After reading `body` and loading `existing`, compute:

```ts
const languageError = validateInvitationLanguageSettings({
  languageSwitcherEnabled:
    body.languageSwitcherEnabled ?? existing.languageSwitcherEnabled,
  enabledLocales: body.enabledLocales ?? existing.enabledLocales,
});
if (languageError) {
  return NextResponse.json({ error: languageError }, { status: 400 });
}

const normalizedFields = normalizeTranslationIdFields({
  schedule:
    body.schedule === undefined
      ? undefined
      : (body.schedule as InvitationData["schedule"]),
  faqs:
    body.faqs === undefined
      ? undefined
      : (body.faqs as InvitationData["faqs"]),
  dressCode:
    body.dressCode === undefined
      ? undefined
      : (body.dressCode as InvitationData["dressCode"]),
  coupleGallery:
    body.coupleGallery === undefined
      ? undefined
      : (body.coupleGallery as InvitationData["coupleGallery"]),
});
```

Use `normalizedFields.schedule`, `normalizedFields.faqs`,
`normalizedFields.dressCode`, and `normalizedFields.coupleGallery` when those
properties were present in `body`. Add update entries:

```ts
...(body.languageSwitcherEnabled !== undefined && {
  languageSwitcherEnabled: body.languageSwitcherEnabled === true,
}),
...(body.enabledLocales !== undefined && {
  enabledLocales: normalizeInvitationLocales(body.enabledLocales),
}),
...(body.translations !== undefined && {
  translations: sanitizeJsonField(
    sanitizeInvitationTranslations(body.translations),
    null,
  ),
}),
```

- [ ] **Step 7: Add the fields to public and admin mappers**

Extend both row types and returned objects:

```ts
languageSwitcherEnabled: boolean;
enabledLocales: string[];
translations: unknown;
```

Map them as:

```ts
languageSwitcherEnabled: row.languageSwitcherEnabled,
enabledLocales: normalizeInvitationLocales(row.enabledLocales),
translations:
  sanitizeInvitationTranslations(row.translations) ?? undefined,
```

Add the same defaulted properties to `getDefaultFormState` in
`InvitationForm.tsx` later in Task 7.

- [ ] **Step 8: Update duplication fixtures and assertions**

Add to `sourceInvitationRow`:

```ts
languageSwitcherEnabled: true,
enabledLocales: ["pt", "en"],
translations: { en: { quote: "Our story" } },
```

Because duplication already goes through `toAdminInvitationInitialData`, assert
in `tests/invitation-duplication.test.ts` that the duplicate retains these
three values while still resetting slug, demo, pricing, and landing metadata.

- [ ] **Step 9: Carry locale fields through the idempotent seed**

In both the `update` and `create` objects in `prisma/seed.ts`, add:

```ts
languageSwitcherEnabled: data.languageSwitcherEnabled === true,
enabledLocales: normalizeInvitationLocales(data.enabledLocales),
translations: sanitizeInvitationTranslations(data.translations) ?? null,
```

Import both helpers from `@/lib/invitation-translations`. Existing JSON files
therefore seed as Portuguese-only; a future reference JSON file can carry
explicit locale selections and overlays.

- [ ] **Step 10: Run focused persistence tests**

Run:

```bash
npx vitest run \
  tests/invitation-language-persistence.test.ts \
  tests/invitation-create-data.test.ts \
  tests/invitation-admin-initial-data.test.ts \
  tests/invitation-duplication.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit persistence**

```bash
git add prisma/schema.prisma \
  prisma/migrations/20260719190000_add_invitation_translations/migration.sql \
  lib/invitation-create-data.ts \
  lib/invitation-admin-initial-data.ts \
  lib/invitations.ts \
  prisma/seed.ts \
  app/api/admin/invitations/route.ts \
  'app/api/admin/invitations/[id]/route.ts' \
  tests/fixtures/invitation-duplication.ts \
  tests/invitation-language-persistence.test.ts \
  tests/invitation-create-data.test.ts \
  tests/invitation-admin-initial-data.test.ts \
  tests/invitation-duplication.test.ts
git commit -m "feat: persist invitation translations"
```

---

### Task 4: Locale URLs, redirects, localized metadata, and main invitation rendering

**Files:**
- Create: `lib/invitation-language-routing.ts`
- Create: `tests/invitation-language-routing.test.ts`
- Modify: `lib/seo.ts:25-37`
- Modify: `app/[locale]/[slug]/page.tsx:41-245`
- Modify: `tests/social-preview-metadata.test.ts`

**Interfaces:**
- Consumes: `getEffectiveInvitationLocales`, `localizeInvitation`, existing
  `buildLocaleHref`, `buildLocalePath`, and `getInvitation`.
- Produces:
  - `InvitationSearchParams`
  - `InvitationSearchParamsInput`
  - `serializeInvitationSearchParams(searchParams): string`
  - `getInvitationSearchParam(searchParams, key): string | undefined`
  - `buildInvitationLocaleSwitchHref(pathname, searchParams, locale): string`
  - `getInvitationLocaleRedirectPath(invitation, locale, pathname, searchParams): string | null`
  - `buildLanguageAlternates(origin, path, locales?)`

- [ ] **Step 1: Add failing pure routing tests**

Create `tests/invitation-language-routing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { duplicateForm } from "./fixtures/invitation-duplication";
import {
  buildInvitationLocaleSwitchHref,
  getInvitationLocaleRedirectPath,
} from "@/lib/invitation-language-routing";

const invitation = duplicateForm({
  invitationType: "standard",
  languageSwitcherEnabled: true,
  enabledLocales: ["pt", "en"],
});

describe("invitation locale routing", () => {
  it("preserves query parameters and opens at the hero", () => {
    expect(
      buildInvitationLocaleSwitchHref(
        "/ana-joao",
        { g: "guest token", campaign: "summer" },
        "en",
      ),
    ).toBe("/en/ana-joao?g=guest+token&campaign=summer&section=hero");
  });

  it("redirects a disabled locale to Portuguese with every query value", () => {
    expect(
      getInvitationLocaleRedirectPath(
        invitation,
        "es",
        "/es/ana-joao",
        { g: "abc", tag: ["one", "two"] },
      ),
    ).toBe("/ana-joao?g=abc&tag=one&tag=two");
  });

  it("does not redirect an effective locale", () => {
    expect(
      getInvitationLocaleRedirectPath(
        invitation,
        "en",
        "/en/ana-joao",
        { g: "abc" },
      ),
    ).toBeNull();
  });

  it("does not change existing external invitation locale behavior", () => {
    expect(
      getInvitationLocaleRedirectPath(
        { ...invitation, invitationType: "external_link" },
        "es",
        "/es/ana-joao",
        { g: "abc" },
      ),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the routing test to verify failure**

Run:

```bash
npx vitest run tests/invitation-language-routing.test.ts
```

Expected: FAIL because the routing module does not exist.

- [ ] **Step 3: Implement query-safe locale routing**

Create:

```ts
import type { AppLocale } from "@/i18n/locales";
import { buildLocaleHref } from "@/i18n/locales";
import { getEffectiveInvitationLocales } from "@/lib/invitation-translations";
import type { InvitationData } from "@/lib/types";

export type InvitationSearchParams = Record<
  string,
  string | string[] | undefined
>;
export type InvitationSearchParamsInput = InvitationSearchParams | string;

export function serializeInvitationSearchParams(
  searchParams: InvitationSearchParamsInput,
): string {
  if (typeof searchParams === "string") {
    return new URLSearchParams(searchParams).toString();
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params.toString();
}

export function getInvitationSearchParam(
  searchParams: InvitationSearchParams,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function buildInvitationLocaleSwitchHref(
  pathname: string,
  searchParams: InvitationSearchParamsInput,
  locale: AppLocale,
): string {
  const next = new URLSearchParams(serializeInvitationSearchParams(searchParams));
  next.set("section", "hero");
  return buildLocaleHref(`${pathname}?${next.toString()}`, locale);
}

export function getInvitationLocaleRedirectPath(
  invitation: InvitationData,
  locale: AppLocale,
  pathname: string,
  searchParams: InvitationSearchParams,
): string | null {
  if (invitation.invitationType !== "standard") return null;
  if (getEffectiveInvitationLocales(invitation).includes(locale)) return null;
  const query = serializeInvitationSearchParams(searchParams);
  return buildLocaleHref(`${pathname}${query ? `?${query}` : ""}`, "pt");
}
```

`buildLocaleHref` removes the existing locale prefix, so the redirect keeps the
same route shape while changing only the locale.

- [ ] **Step 4: Make SEO alternates accept an explicit locale list**

Change:

```ts
export function buildLanguageAlternates(
  origin: string,
  path: string,
  locales: readonly AppLocale[] = SUPPORTED_LOCALES,
) {
  const entries = Object.fromEntries(
    locales.map((locale) => [
      locale,
      buildAbsoluteUrl(origin, buildLocalePath(path, locale)),
    ]),
  ) as Partial<Record<AppLocale, string>>;

  return {
    ...entries,
    "x-default": buildAbsoluteUrl(
      origin,
      buildLocalePath(path, DEFAULT_LOCALE),
    ),
  };
}
```

Extend `tests/i18n-locales.test.ts` or `tests/social-preview-metadata.test.ts`
to assert that `["pt", "en"]` omits `es` and retains `x-default`.

- [ ] **Step 5: Enforce and localize the main invitation route**

In `InvitationSlugPage`:

1. Await both the raw locale and the complete `searchParams` object.
2. Load `sourceInvitation`.
3. Build `pathname = buildLocalePath(\`/${slug}\`, locale)`.
4. Call `getInvitationLocaleRedirectPath`.
5. Call `redirect(redirectPath)` from `next/navigation` when non-null.
6. Set `invitation = localizeInvitation(sourceInvitation, locale)`.
7. Resolve guests against `sourceInvitation` and attach them to the localized
   object.

Use a search-param type that preserves arbitrary values:

```ts
searchParams: Promise<InvitationSearchParams>;
```

Read scalar parameters such as `g`, `landingPreview`, `lazyExternalIframe`, and
`section` through `getInvitationSearchParam` so repeated query keys cannot leak
arrays into existing string-only APIs.

The canonical invitation remains the input to access policy; the localized
invitation is the input to page rendering, social-preview fallback copy, and
JSON-LD.

- [ ] **Step 6: Localize invitation metadata**

In `generateMetadata`:

```ts
const effectiveLocales =
  sourceInvitation.invitationType === "standard"
    ? getEffectiveInvitationLocales(sourceInvitation)
    : SUPPORTED_LOCALES;
const metadataLocale = effectiveLocales.includes(locale) ? locale : "pt";
const invitation = localizeInvitation(sourceInvitation, metadataLocale);
```

Use `metadataLocale` for canonical/Open Graph URLs and:

```ts
languages: buildLanguageAlternates(
  SITE_URL,
  `/${slug}`,
  effectiveLocales,
),
```

JSON-LD must use the localized `title`, `description`,
`invitation.location.name`, and `invitation.location.address`, and its URL must
use the active locale rather than hardcoded Portuguese.

Extend the existing source-contract section in
`tests/social-preview-metadata.test.ts`:

```ts
const invitationPage = readFileSync("app/[locale]/[slug]/page.tsx", "utf8");
expect(invitationPage).toContain("getInvitationLocaleRedirectPath");
expect(invitationPage).toContain("localizeInvitation");
expect(invitationPage).toContain("getEffectiveInvitationLocales");
expect(invitationPage).toContain("buildLanguageAlternates(");
expect(invitationPage).not.toContain(
  'buildLocalePath(`/${slug}`, "pt")',
);
```

- [ ] **Step 7: Run routing and metadata tests**

Run:

```bash
npx vitest run \
  tests/invitation-language-routing.test.ts \
  tests/i18n-locales.test.ts \
  tests/social-preview-metadata.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit public locale routing**

```bash
git add lib/invitation-language-routing.ts \
  lib/seo.ts \
  'app/[locale]/[slug]/page.tsx' \
  tests/invitation-language-routing.test.ts \
  tests/i18n-locales.test.ts \
  tests/social-preview-metadata.test.ts
git commit -m "feat: localize public invitation routes"
```

---

### Task 5: Propagate locale policy to gifts and standalone RSVP

**Files:**
- Create: `tests/invitation-language-pages.test.ts`
- Modify: `app/[locale]/[slug]/gifts/page.tsx:1-64`
- Modify: `app/[locale]/confirmar/[slug]/page.tsx:1-119`

**Interfaces:**
- Consumes: Task 4 redirect helper and Task 2 localization.
- Produces: localized `InvitationData` for `GiftsListView`; localized RSVP
  copy/custom fields for `RsvpPage`.

- [ ] **Step 1: Add failing related-route wiring tests**

Create:

```ts
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
```

- [ ] **Step 2: Run the test to verify route wiring is absent**

Run:

```bash
npx vitest run tests/invitation-language-pages.test.ts
```

Expected: FAIL on both route files.

- [ ] **Step 3: Localize the gifts page**

Keep `sourceInvitation` for feature/availability identity, enforce the requested
locale with the full search-param object, then create:

```ts
const invitation = localizeInvitation(sourceInvitation, resolveLocale(locale));
```

Use the localized object for `hasGiftItems`, `GiftsListView`, gift names, and
copy. Continue using the canonical slug, item IDs, guest token, and reservation
API. Preserve all query parameters when redirecting to Portuguese or back to
the invitation. Read the scalar guest token with
`getInvitationSearchParam(searchParams, "g")`.

- [ ] **Step 4: Refactor standalone RSVP to the shared invitation mapper**

Replace the partial Prisma query with:

```ts
const sourceInvitation = await getInvitation(slug);
if (!sourceInvitation) notFound();
```

Enforce locale policy before rendering, then:

```ts
const invitation = localizeInvitation(
  sourceInvitation,
  resolveLocale(locale),
);
```

Read couple, date, RSVP settings, `customTexts`, and custom fields from the
localized invitation. Guest lookup and submission continue using slug and
field IDs. Read the scalar guest token with
`getInvitationSearchParam(searchParams, "g")` and remove the direct `prisma`
import.

- [ ] **Step 5: Run related-page tests**

Run:

```bash
npx vitest run \
  tests/invitation-language-pages.test.ts \
  tests/rsvp-custom-fields.test.ts \
  tests/gift-reservation-public-route.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit related page localization**

```bash
git add 'app/[locale]/[slug]/gifts/page.tsx' \
  'app/[locale]/confirmar/[slug]/page.tsx' \
  tests/invitation-language-pages.test.ts
git commit -m "feat: localize invitation gifts and rsvp"
```

---

### Task 6: Guest language switcher and hero placement

**Files:**
- Create: `components/shared/InvitationLanguageSwitcher.tsx`
- Modify: `components/shared/InvitationHero.tsx:91-175`
- Modify: `components/elegant-floral/ElegantFloralPage.tsx`
- Modify: `components/video-entrance/VideoEntranceHero.tsx`
- Modify: `components/curtain-canva/CurtainsHero.tsx`
- Modify: `tests/invitation-language-pages.test.ts`

**Interfaces:**
- Consumes: effective locales, visibility predicate, locale switch URL, current
  `next-intl` locale, Next pathname/search params.
- Produces:
  - `InvitationLanguagePreviewProvider`
  - `InvitationLanguageSwitcher`

- [ ] **Step 1: Add failing hero/envelope wiring assertions**

Append:

```ts
describe("invitation language switcher placement", () => {
  for (const file of [
    "components/shared/InvitationHero.tsx",
    "components/elegant-floral/ElegantFloralPage.tsx",
    "components/video-entrance/VideoEntranceHero.tsx",
    "components/curtain-canva/CurtainsHero.tsx",
  ]) {
    it(`${file} mounts the shared switcher in its hero`, () => {
      expect(readFileSync(file, "utf8")).toContain(
        "<InvitationLanguageSwitcher",
      );
    });
  }

  it("does not mount the switcher on the envelope", () => {
    expect(readFileSync("components/shared/EnvelopeCover.tsx", "utf8")).not.toContain(
      "InvitationLanguageSwitcher",
    );
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
```

- [ ] **Step 2: Run the wiring test to verify failure**

Run:

```bash
npx vitest run tests/invitation-language-pages.test.ts
```

Expected: FAIL because no hero imports the shared switcher.

- [ ] **Step 3: Implement the shared switcher**

Create a client component with an optional preview callback context:

```tsx
"use client";

import { createContext, useContext } from "react";
import { useLocale } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import type { AppLocale } from "@/i18n/locales";
import { getEffectiveInvitationLocales, shouldShowInvitationLanguageSwitcher } from "@/lib/invitation-translations";
import { buildInvitationLocaleSwitchHref } from "@/lib/invitation-language-routing";
import type { InvitationData } from "@/lib/types";

const PreviewLocaleChangeContext = createContext<
  ((locale: AppLocale) => void) | null
>(null);

export function InvitationLanguagePreviewProvider({
  onLocaleChange,
  children,
}: {
  onLocaleChange: (locale: AppLocale) => void;
  children: React.ReactNode;
}) {
  return (
    <PreviewLocaleChangeContext.Provider value={onLocaleChange}>
      {children}
    </PreviewLocaleChangeContext.Provider>
  );
}

const LABELS: Record<AppLocale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};
```

`InvitationLanguageSwitcher({ invitation })` returns `null` unless
`shouldShowInvitationLanguageSwitcher(invitation)` is true. Render one compact
button/link per effective locale:

- current locale: `aria-current="page"`;
- preview context present: `<button onClick={() => onLocaleChange(locale)}>`;
- public context:
  `<a href={buildInvitationLocaleSwitchHref(pathname, searchParams.toString(), locale)}>`;
- visible text: uppercase locale code;
- `aria-label`: full language name.

Use:

```tsx
className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex rounded-full border border-white/30 bg-black/35 p-1 text-white shadow-lg backdrop-blur-md"
```

Each option uses a 36px minimum hit target, a visible focus ring, and reduced
opacity for inactive locales.

- [ ] **Step 4: Mount it inside every standard hero**

Place:

```tsx
<InvitationLanguageSwitcher invitation={invitation} />
```

as a child of each hero's existing `position: relative` container:

- directly inside `InvitationHero`'s `<section>`;
- inside the top hero section of `ElegantFloralPage`;
- inside `VideoEntranceHero` after its background layers;
- inside `CurtainsHero` after its hero media.

The component's own invitation-type predicate prevents it from appearing when
these reusable renderers receive external invitation data.

- [ ] **Step 5: Run switcher and routing tests**

Run:

```bash
npx vitest run \
  tests/invitation-language-pages.test.ts \
  tests/invitation-language-routing.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the guest switcher**

```bash
git add components/shared/InvitationLanguageSwitcher.tsx \
  components/shared/InvitationHero.tsx \
  components/elegant-floral/ElegantFloralPage.tsx \
  components/video-entrance/VideoEntranceHero.tsx \
  components/curtain-canva/CurtainsHero.tsx \
  tests/invitation-language-pages.test.ts
git commit -m "feat: add invitation language switcher"
```

---

### Task 7: Admin locale settings, canonical state, and localized preview

**Files:**
- Create: `components/admin/InvitationLanguageSettings.tsx`
- Create: `i18n/client-messages.ts`
- Modify: `app/admin/invitations/InvitationForm.tsx:510-540`
- Modify: `app/admin/invitations/InvitationForm.tsx:1377-1491`
- Modify: `app/admin/invitations/InvitationForm.tsx:3890-3940`
- Modify: `tests/invitation-language-pages.test.ts`

**Interfaces:**
- Consumes:
  - `buildInvitationTranslationDraft`
  - `applyInvitationTranslationDraft`
  - `localizeInvitation`
  - `normalizeInvitationTranslationIds`
  - `InvitationLanguagePreviewProvider`
- Produces: one canonical form state, one active editing locale, a raw
  translation draft for fields, and a fallback-filled localized preview.

- [ ] **Step 1: Add failing admin-wiring assertions**

Append:

```ts
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
```

- [ ] **Step 2: Run the admin wiring test to verify failure**

Run:

```bash
npx vitest run tests/invitation-language-pages.test.ts
```

Expected: FAIL on the new admin assertions.

- [ ] **Step 3: Add explicit client message lookup**

Create:

```ts
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";
import type { AppLocale } from "@/i18n/locales";

const CLIENT_MESSAGES = { pt, en, es } as const;

export function getClientMessages(locale: AppLocale) {
  return CLIENT_MESSAGES[locale];
}
```

- [ ] **Step 4: Build the admin settings component**

`InvitationLanguageSettings` receives:

```ts
interface InvitationLanguageSettingsProps {
  enabled: boolean;
  enabledLocales: AppLocale[];
  activeLocale: AppLocale;
  onEnabledChange: (enabled: boolean) => void;
  onEnabledLocalesChange: (locales: AppLocale[]) => void;
  onActiveLocaleChange: (locale: AppLocale) => void;
}
```

Render:

- an `Activar seletor de idiomas` switch;
- a locked Portuguese row;
- English and Spanish switches;
- inline red copy `Ative pelo menos um idioma adicional.` when enabled with
  only Portuguese;
- a segmented editing selector for normalized enabled locales;
- explanatory copy that blank translations fall back to Portuguese.

If a selected locale is disabled, call `onActiveLocaleChange("pt")` before
emitting the new locale list.

- [ ] **Step 5: Replace one-state editing with canonical and draft state**

Initialize:

```ts
const [sourceForm, setSourceForm] = useState<InvitationData>(() =>
  normalizeInvitationTranslationIds(
    initialData ?? getDefaultFormState(themes[0]),
  ),
);
const [activeLocale, setActiveLocale] = useState<AppLocale>("pt");

const form = useMemo(
  () => buildInvitationTranslationDraft(sourceForm, activeLocale),
  [sourceForm, activeLocale],
);
const previewInvitation = useMemo(
  () => localizeInvitation(sourceForm, activeLocale),
  [sourceForm, activeLocale],
);

const setForm = useCallback(
  (next: React.SetStateAction<InvitationData>) => {
    setSourceForm((source) => {
      const current = buildInvitationTranslationDraft(source, activeLocale);
      const draft = typeof next === "function" ? next(current) : next;
      return applyInvitationTranslationDraft(source, activeLocale, draft);
    });
  },
  [activeLocale],
);
```

Add defaults:

```ts
languageSwitcherEnabled: false,
enabledLocales: ["pt"],
translations: undefined,
```

All existing form handlers continue using `form` and `setForm`; the pure draft
adapter redirects translatable strings to the overlay and shared changes to
the canonical source.

- [ ] **Step 6: Make validation and submit canonical**

`handleSubmit` validates `sourceForm.slug`, source couple names, and source RSVP
custom labels/options. Before fetching, call:

```ts
const languageError = validateInvitationLanguageSettings(sourceForm);
if (languageError) {
  toast.error(languageError);
  return;
}
```

Build and send a payload that can explicitly clear the JSON column:

```ts
const normalized = normalizeInvitationTranslationIds(sourceForm);
const payload = {
  ...normalized,
  translations: normalized.translations ?? null,
};

const res = await fetch(url, {
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

Do not submit `form`, because it is the selected locale's raw translation
draft.

- [ ] **Step 7: Mount language settings above the accordion**

Wire changes through canonical state:

```tsx
<InvitationLanguageSettings
  enabled={sourceForm.languageSwitcherEnabled === true}
  enabledLocales={normalizeInvitationLocales(sourceForm.enabledLocales)}
  activeLocale={activeLocale}
  onEnabledChange={(enabled) => {
    if (!enabled) setActiveLocale("pt");
    setSourceForm((current) => ({
      ...current,
      languageSwitcherEnabled: enabled,
    }));
  }}
  onEnabledLocalesChange={(enabledLocales) =>
    setSourceForm((current) => ({ ...current, enabledLocales }))
  }
  onActiveLocaleChange={setActiveLocale}
/>
```

Keep this outside the translated field draft so locale configuration always
updates canonical state.

- [ ] **Step 8: Localize the preview only**

Wrap the invitation preview, not the Portuguese admin chrome:

```tsx
<NextIntlClientProvider
  locale={activeLocale}
  messages={getClientMessages(activeLocale)}
>
  <InvitationLanguagePreviewProvider onLocaleChange={setActiveLocale}>
    {isElegantFloral ? (
      <ElegantFloralPage
        invitation={previewInvitation}
        theme={currentTheme}
        isPreview
        animateHeroText
      />
    ) : (
      <InvitationPage
        invitation={previewInvitation}
        theme={currentTheme}
        isPreview
      />
    )}
  </InvitationLanguagePreviewProvider>
</NextIntlClientProvider>
```

Continue rendering the envelope preview with Portuguese because the guest
switcher is intentionally absent there.

- [ ] **Step 9: Run admin wiring and domain tests**

Run:

```bash
npx vitest run \
  tests/invitation-language-pages.test.ts \
  tests/invitation-translations.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit admin locale state**

```bash
git add components/admin/InvitationLanguageSettings.tsx \
  i18n/client-messages.ts \
  app/admin/invitations/InvitationForm.tsx \
  tests/invitation-language-pages.test.ts
git commit -m "feat: add admin invitation locale controls"
```

---

### Task 8: Translation-aware fields and structural locks

**Files:**
- Modify: `app/admin/invitations/InvitationForm.tsx`
- Modify: `components/admin/GiftsListEditor.tsx`
- Modify: `components/admin/BankTransferEditor.tsx`
- Modify: `components/admin/RsvpCustomFieldsBuilder.tsx`
- Modify: `components/admin/GuestGuideFormSection.tsx`
- Modify: `components/admin/PlacesFormSection.tsx`
- Modify: `components/admin/CoupleGalleryEditor.tsx`
- Modify: `components/admin/HeroTextEditor.tsx`
- Modify: `components/admin/ElegantFloralDressFields.tsx`
- Modify: `tests/invitation-language-pages.test.ts`

**Interfaces:**
- Consumes: Task 7's `sourceForm`, raw `form` draft, `activeLocale`, and draft
  setter.
- Produces: complete translation coverage, Portuguese source placeholders, and
  source-only list structure.

- [ ] **Step 1: Add failing coverage assertions for every child editor**

Append:

```ts
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
```

- [ ] **Step 2: Run the coverage test to verify failure**

Run:

```bash
npx vitest run tests/invitation-language-pages.test.ts
```

Expected: FAIL for all eight child editors.

- [ ] **Step 3: Add one consistent child-editor contract**

Each editor receives:

```ts
sourceValue: ExistingValueType | undefined;
structureLocked?: boolean;
```

Rules:

- `structureLocked` disables add, delete, reorder, duplicate, and predefined
  selection controls.
- Text fields use the Portuguese item matched by stable ID as their placeholder
  when their draft value is blank.
- Shared media, URL, price/value, visual style, required, visibility, and other
  non-text controls stay enabled.
- A compact note reads `A estrutura é editada em Português.` when locked.

Use ID lookups, never array indexes, for fallback placeholders:

```ts
const sourceById = new Map(
  (sourceValue ?? []).map((item) => [item.id, item]),
);
```

- [ ] **Step 4: Update gift and bank editors**

`GiftsListEditor`:

- source item name becomes the `name` placeholder;
- image, price, and link remain shared/editable;
- add/remove/move are disabled when locked.

`BankTransferEditor`:

- source row label becomes the `label` placeholder;
- bank value and copyable switch remain shared/editable;
- add/remove/move are disabled when locked.

Pass:

```tsx
sourceValue={sourceForm.giftRegistry.items}
structureLocked={activeLocale !== "pt"}
```

and the equivalent bank-transfer source.

- [ ] **Step 5: Update RSVP custom fields**

Match source fields and options by ID. Use source labels as placeholders.
Disable:

- add/remove/reorder fields;
- changing field type when it would add/remove options;
- add/remove options.

Keep `required` and `visibility` shared and editable. Pass
`sourceValue={sourceForm.rsvp.customFields}` and the locale lock.

- [ ] **Step 6: Update guest guide and places**

Guest guide:

- custom and predefined item labels are translatable;
- translation mode renders a label input for every selected item, including
  predefined items, with the Portuguese label as its placeholder;
- icon type/name/URL remain shared;
- predefined toggles, add/remove, and reorder are locked.

Places:

- section title, item title, and item description are translatable;
- layout, enabled state, media, map URL, and phone remain shared;
- add/remove/reorder section/item actions are locked.

Both use stable IDs for Portuguese placeholders.

- [ ] **Step 7: Update gallery, hero text, and elegant dress code**

Gallery:

- title and captions are translatable;
- enabled/style/autoplay/media/focal settings remain shared;
- upload/remove/reorder image actions are locked;
- key images by their stable `id`, not array index.
- new Portuguese images use
  `{ id: \`gallery-image-${crypto.randomUUID()}\`, src: url }`.

Hero text:

- block `content` is translatable with source content as the textarea
  placeholder;
- position, size, font, color, alignment, shadow, rotation, and z-index remain
  shared;
- add/duplicate/remove block actions are locked.

Elegant dress:

- title, intro, ladies/gentlemen labels and notes, reserved note, and palette
  names are translatable;
- images and swatch hex values remain shared;
- add/remove palette rows are locked;
- new Portuguese palette rows receive
  `{ id: \`dress-color-${crypto.randomUUID()}\`, name: "" }`.

- [ ] **Step 8: Lock inline structures and add Portuguese placeholders**

In `InvitationForm.tsx`, define:

```ts
const structureLocked = activeLocale !== "pt";
const sourcePlaceholder = (
  source: string | undefined,
  ordinary: string,
) => (structureLocked && source?.trim() ? source : ordinary);
```

Use Portuguese source placeholders for every inline translatable field:

- quote and hero top text;
- primary/secondary location name and address;
- schedule label and venue;
- dress-code base text;
- gift intro and bank-transfer intro;
- parents blessing/invitation messages;
- Our Story title and description;
- FAQ question and answer;
- every `CUSTOM_TEXT_GROUPS` field.

Disable source-structure actions in translation mode:

- add/remove second location;
- add/remove/reorder schedule rows;
- add/remove FAQs;
- clear-all Portuguese custom texts.

When adding source rows in Portuguese, assign IDs immediately:

```ts
const scheduleItem: ScheduleEvent = {
  id: `schedule-${crypto.randomUUID()}`,
  time: "",
  label: "",
  venue: "",
  icon: "neutral",
};
const faq: FAQItem = {
  id: `faq-${crypto.randomUUID()}`,
  question: "",
  answer: "",
};
```

For custom text inputs, use the active draft value and:

```tsx
placeholder={sourcePlaceholder(
  sourceForm.customTexts?.[field.key],
  field.placeholder,
)}
```

Clearing a translated field removes the overlay leaf through
`applyInvitationTranslationDraft`; it must not clear Portuguese.

- [ ] **Step 9: Pass source/lock props to all child editors**

At each existing call site, add the matching canonical section and lock
attributes. For `PlacesFormSection`, add:

```tsx
sourceValue={sourceForm.places}
structureLocked={structureLocked}
```

For `HeroTextEditor`, add:

```tsx
sourceValue={sourceForm.heroTextLayer}
structureLocked={structureLocked}
```

Apply the same contract to all eight editors listed in Step 1.

- [ ] **Step 10: Run editor coverage and domain behavior tests**

Run:

```bash
npx vitest run \
  tests/invitation-language-pages.test.ts \
  tests/invitation-translations.test.ts \
  tests/rsvp-custom-fields.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit translation-aware editing**

```bash
git add app/admin/invitations/InvitationForm.tsx \
  components/admin/GiftsListEditor.tsx \
  components/admin/BankTransferEditor.tsx \
  components/admin/RsvpCustomFieldsBuilder.tsx \
  components/admin/GuestGuideFormSection.tsx \
  components/admin/PlacesFormSection.tsx \
  components/admin/CoupleGalleryEditor.tsx \
  components/admin/HeroTextEditor.tsx \
  components/admin/ElegantFloralDressFields.tsx \
  tests/invitation-language-pages.test.ts
git commit -m "feat: edit translated invitation content"
```

---

### Task 9: Full verification and migration safety

**Files:**
- Verify all files changed in Tasks 1-8; this task introduces no planned source
  file.

**Interfaces:**
- Consumes: Tasks 1-8.
- Produces: a generated Prisma client, passing repository checks, and a
  production build using the required command.

- [ ] **Step 1: Run the complete focused feature suite**

Run:

```bash
npx vitest run \
  tests/invitation-translations.test.ts \
  tests/invitation-language-routing.test.ts \
  tests/invitation-language-persistence.test.ts \
  tests/invitation-language-pages.test.ts \
  tests/social-preview-metadata.test.ts \
  tests/invitation-create-data.test.ts \
  tests/invitation-admin-initial-data.test.ts \
  tests/invitation-duplication.test.ts \
  tests/rsvp-custom-fields.test.ts \
  tests/gift-reservation-public-route.test.ts
```

Expected: all listed test files PASS.

- [ ] **Step 2: Run the complete test suite**

Run:

```bash
npm test
```

Expected: all `tests/**/*.test.ts` files PASS with no unhandled errors.

- [ ] **Step 3: Run ESLint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 4: Regenerate Prisma and run TypeScript without emitting**

Run:

```bash
npm run db:generate
npx tsc --noEmit
```

Expected: Prisma generation succeeds and TypeScript exits 0.

- [ ] **Step 5: Apply the development migration through the repository command**

Run:

```bash
npm run db:migrate:dev -- --name add_invitation_translations
```

Expected: Prisma reports the migration applied or already applied and does not
generate a second migration. If it proposes a second migration, compare it
against `20260719190000_add_invitation_translations/migration.sql`, fix schema
drift, and rerun until no additional migration is proposed.

- [ ] **Step 6: Run the required production build command**

Run:

```bash
npm run build
```

Expected: `prisma generate`, `prisma migrate deploy`, and `next build` all
complete successfully. Do not substitute `next build`.

- [ ] **Step 7: Inspect the final diff and verify scope**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected:

- no whitespace errors;
- no changes to `.env.development` or `.env.production`;
- no generated `lib/generated/prisma/` files staged;
- no language-switcher changes under Save the Date or external invitation
  forms/renderers;
- only the files listed by this plan plus failure-fix files are changed.

---

## Implementation Completion Checklist

- [ ] Existing invitations remain Portuguese-only until explicitly enabled.
- [ ] Portuguese is always present and cannot be disabled.
- [ ] Enabling the switcher without English or Spanish is rejected in client
  and API.
- [ ] English and Spanish translations are sparse and preserve whitespace
  inside non-empty content.
- [ ] Missing/malformed translations fall back to Portuguese per field.
- [ ] Every approved admin-authored guest text is covered.
- [ ] Reordering content retains translations by stable ID.
- [ ] Translation mode cannot change list membership or ordering.
- [ ] Shared media, style, URL, time, phone, and payment data remain editable
  and common to all locales.
- [ ] Admin preview system messages, dates, and invitation content use the
  selected locale.
- [ ] The switcher appears only in the top-right of standard heroes.
- [ ] The switcher never appears on the envelope.
- [ ] Switching preserves guest/query parameters and does not replay the
  envelope.
- [ ] Disabled locale URLs redirect to Portuguese.
- [ ] Gifts and standalone RSVP use the invitation's selected locale.
- [ ] Metadata and JSON-LD use localized content and only effective alternates.
- [ ] External-link, external-video, and Save the Date behavior is unchanged.
- [ ] Create, edit, hydration, duplication, tests, lint, Prisma generation,
  migration, TypeScript, and production build all pass.
