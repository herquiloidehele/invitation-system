import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/locales";
import { CUSTOM_TEXT_GROUPS } from "@/lib/custom-texts";
import type {
  CoupleGallery,
  CustomTexts,
  DressCode,
  FAQItem,
  GiftRegistry,
  GuestGuide,
  HeroTextLayer,
  InvitationData,
  InvitationTranslationOverlay,
  InvitationTranslations,
  LocationInfo,
  OurStory,
  ParentsInfo,
  PlacesConfig,
  ScheduleEvent,
  TranslationLocale,
} from "@/lib/types";

export type InvitationLanguageSettings = Pick<
  InvitationData,
  "languageSwitcherEnabled" | "enabledLocales"
>;

type UnknownObject = Record<string, unknown>;

type TranslationIdFields = Partial<
  Pick<InvitationData, "schedule" | "faqs" | "dressCode" | "coupleGallery">
>;

const TRANSLATION_LOCALES = ["en", "es"] as const;

const CUSTOM_TEXT_KEYS = new Set<keyof CustomTexts>(
  CUSTOM_TEXT_GROUPS.flatMap((group) => group.fields.map((field) => field.key)),
);

function readObject(value: unknown): UnknownObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownObject)
    : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function compact<T extends object>(value: T): T | undefined {
  return Object.values(value).some((item) => item !== undefined)
    ? value
    : undefined;
}

function readRecord<T>(
  value: unknown,
  readEntry: (value: unknown) => T | undefined,
): Record<string, T> | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const result: Record<string, T> = {};
  for (const [key, entry] of Object.entries(input)) {
    const next = readEntry(entry);
    if (next !== undefined) result[key] = next;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeLocation(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;
  return compact({
    name: readString(input.name),
    address: readString(input.address),
  });
}

function sanitizeSchedule(value: unknown) {
  return readRecord(value, (entry) => {
    const input = readObject(entry);
    if (!input) return undefined;
    return compact({
      label: readString(input.label),
      venue: readString(input.venue),
    });
  });
}

function sanitizeDressCode(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;

  const sanitizeAudience = (audience: unknown) => {
    const item = readObject(audience);
    if (!item) return undefined;
    return compact({
      label: readString(item.label),
      note: readString(item.note),
    });
  };

  return compact({
    text: readString(input.text),
    title: readString(input.title),
    intro: readString(input.intro),
    ladies: sanitizeAudience(input.ladies),
    gentlemen: sanitizeAudience(input.gentlemen),
    reservedNote: readString(input.reservedNote),
    palette: readRecord(input.palette, (entry) => {
      const item = readObject(entry);
      if (!item) return undefined;
      return compact({ name: readString(item.name) });
    }),
  });
}

function sanitizeGiftRegistry(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;

  return compact({
    text: readString(input.text),
    bankTransferText: readString(input.bankTransferText),
    items: readRecord(input.items, (entry) => {
      const item = readObject(entry);
      if (!item) return undefined;
      return compact({ name: readString(item.name) });
    }),
    bankTransfer: readRecord(input.bankTransfer, (entry) => {
      const item = readObject(entry);
      if (!item) return undefined;
      return compact({ label: readString(item.label) });
    }),
  });
}

function sanitizeGallery(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;

  return compact({
    title: readString(input.title),
    images: readRecord(input.images, (entry) => {
      const item = readObject(entry);
      if (!item) return undefined;
      return compact({ caption: readString(item.caption) });
    }),
  });
}

function sanitizePlaces(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;

  return compact({
    sections: readRecord(input.sections, (entry) => {
      const section = readObject(entry);
      if (!section) return undefined;
      return compact({
        title: readString(section.title),
        items: readRecord(section.items, (itemValue) => {
          const item = readObject(itemValue);
          if (!item) return undefined;
          return compact({
            title: readString(item.title),
            description: readString(item.description),
          });
        }),
      });
    }),
  });
}

function sanitizeParents(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;
  return compact({
    blessingMessage: readString(input.blessingMessage),
    inviteMessage: readString(input.inviteMessage),
  });
}

function sanitizeOurStory(value: unknown) {
  const input = readObject(value);
  if (!input) return undefined;
  return compact({
    title: readString(input.title),
    description: readString(input.description),
  });
}

function sanitizeRsvpCustomFields(value: unknown) {
  return readRecord(value, (entry) => {
    const field = readObject(entry);
    if (!field) return undefined;
    return compact({
      label: readString(field.label),
      options: readRecord(field.options, (optionValue) => {
        const option = readObject(optionValue);
        if (!option) return undefined;
        return compact({ label: readString(option.label) });
      }),
    });
  });
}

function sanitizeCustomTexts(value: unknown): CustomTexts | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const result: CustomTexts = {};
  for (const [key, value] of Object.entries(input)) {
    if (!CUSTOM_TEXT_KEYS.has(key as keyof CustomTexts)) continue;
    const text = readString(value);
    if (text !== undefined) {
      result[key as keyof CustomTexts] = text;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeOverlay(
  value: unknown,
): InvitationTranslationOverlay | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const stringRecord = <K extends string>(
    recordValue: unknown,
    key: K,
  ): Record<string, Record<K, string>> | undefined =>
    readRecord(recordValue, (entry) => {
      const item = readObject(entry);
      if (!item) return undefined;
      const text = readString(item[key]);
      return text === undefined
        ? undefined
        : ({ [key]: text } as Record<K, string>);
    });

  return compact({
    quote: readString(input.quote),
    heroTopText: readString(input.heroTopText),
    location: sanitizeLocation(input.location),
    location2: sanitizeLocation(input.location2),
    schedule: sanitizeSchedule(input.schedule),
    dressCode: sanitizeDressCode(input.dressCode),
    giftRegistry: sanitizeGiftRegistry(input.giftRegistry),
    heroTextBlocks: stringRecord(input.heroTextBlocks, "content"),
    faqs: readRecord(input.faqs, (entry) => {
      const item = readObject(entry);
      if (!item) return undefined;
      return compact({
        question: readString(item.question),
        answer: readString(item.answer),
      });
    }),
    guestGuideItems: stringRecord(input.guestGuideItems, "label"),
    coupleGallery: sanitizeGallery(input.coupleGallery),
    places: sanitizePlaces(input.places),
    parents: sanitizeParents(input.parents),
    ourStory: sanitizeOurStory(input.ourStory),
    rsvpCustomFields: sanitizeRsvpCustomFields(input.rsvpCustomFields),
    customTexts: sanitizeCustomTexts(input.customTexts),
  });
}

type MissingTranslationBehavior = "fallback" | "blank";

function transformCustomTexts(
  source: CustomTexts | undefined,
  overlay: CustomTexts | undefined,
  behavior: MissingTranslationBehavior,
): CustomTexts | undefined {
  if (behavior === "fallback") {
    const merged = { ...source, ...overlay };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  const result: CustomTexts = {};
  for (const key of CUSTOM_TEXT_KEYS) {
    result[key] = overlay?.[key] ?? "";
  }
  return result;
}

function transformLocation(
  source: LocationInfo,
  overlay: InvitationTranslationOverlay["location"],
  behavior: MissingTranslationBehavior,
): LocationInfo {
  return {
    ...source,
    name: overlay?.name ?? (behavior === "blank" ? "" : source.name),
    address: overlay?.address ?? (behavior === "blank" ? "" : source.address),
  };
}

function transformSchedule(
  source: ScheduleEvent[],
  overlay: InvitationTranslationOverlay["schedule"],
  behavior: MissingTranslationBehavior,
): ScheduleEvent[] {
  return source.map((item) => {
    const translated = item.id ? overlay?.[item.id] : undefined;
    return {
      ...item,
      label: translated?.label ?? (behavior === "blank" ? "" : item.label),
      venue: translated?.venue ?? (behavior === "blank" ? "" : item.venue),
    };
  });
}

function transformDressCode(
  source: DressCode,
  overlay: InvitationTranslationOverlay["dressCode"],
  behavior: MissingTranslationBehavior,
): DressCode {
  const optionalText = (translated: string | undefined, value?: string) =>
    translated ?? (behavior === "blank" ? "" : value);

  return {
    ...source,
    text: overlay?.text ?? (behavior === "blank" ? "" : source.text),
    title: optionalText(overlay?.title, source.title),
    intro: optionalText(overlay?.intro, source.intro),
    ladies: source.ladies
      ? {
          ...source.ladies,
          label: optionalText(overlay?.ladies?.label, source.ladies.label),
          note: optionalText(overlay?.ladies?.note, source.ladies.note),
          palette: source.ladies.palette?.map((item) => ({
            ...item,
            name:
              (item.id ? overlay?.palette?.[item.id]?.name : undefined) ??
              (behavior === "blank" ? "" : item.name),
          })),
        }
      : undefined,
    gentlemen: source.gentlemen
      ? {
          ...source.gentlemen,
          label: optionalText(
            overlay?.gentlemen?.label,
            source.gentlemen.label,
          ),
          note: optionalText(overlay?.gentlemen?.note, source.gentlemen.note),
        }
      : undefined,
    reservedNote: optionalText(overlay?.reservedNote, source.reservedNote),
  };
}

function transformGiftRegistry(
  source: GiftRegistry,
  overlay: InvitationTranslationOverlay["giftRegistry"],
  behavior: MissingTranslationBehavior,
): GiftRegistry {
  return {
    ...source,
    text: overlay?.text ?? (behavior === "blank" ? "" : source.text),
    bankTransferText:
      overlay?.bankTransferText ??
      (behavior === "blank" ? "" : source.bankTransferText),
    items: source.items?.map((item) => ({
      ...item,
      name:
        overlay?.items?.[item.id]?.name ??
        (behavior === "blank" ? "" : item.name),
    })),
    bankTransfer: source.bankTransfer?.map((item) => ({
      ...item,
      label:
        overlay?.bankTransfer?.[item.id]?.label ??
        (behavior === "blank" ? "" : item.label),
    })),
  };
}

function transformHeroTextLayer(
  source: HeroTextLayer | undefined,
  overlay: InvitationTranslationOverlay["heroTextBlocks"],
  behavior: MissingTranslationBehavior,
): HeroTextLayer | undefined {
  if (!source) return undefined;
  return {
    ...source,
    blocks: source.blocks.map((block) => ({
      ...block,
      content:
        overlay?.[block.id]?.content ??
        (behavior === "blank" ? "" : block.content),
    })),
  };
}

function transformFaqs(
  source: FAQItem[] | undefined,
  overlay: InvitationTranslationOverlay["faqs"],
  behavior: MissingTranslationBehavior,
): FAQItem[] | undefined {
  return source?.map((item) => {
    const translated = item.id ? overlay?.[item.id] : undefined;
    return {
      ...item,
      question:
        translated?.question ?? (behavior === "blank" ? "" : item.question),
      answer: translated?.answer ?? (behavior === "blank" ? "" : item.answer),
    };
  });
}

function transformGuestGuide(
  source: GuestGuide | undefined,
  overlay: InvitationTranslationOverlay["guestGuideItems"],
  behavior: MissingTranslationBehavior,
): GuestGuide | undefined {
  if (!source) return undefined;
  return {
    ...source,
    items: source.items.map((item) => ({
      ...item,
      label:
        overlay?.[item.id]?.label ?? (behavior === "blank" ? "" : item.label),
    })),
  };
}

function transformGallery(
  source: CoupleGallery | undefined,
  overlay: InvitationTranslationOverlay["coupleGallery"],
  behavior: MissingTranslationBehavior,
): CoupleGallery | undefined {
  if (!source) return undefined;
  return {
    ...source,
    title: overlay?.title ?? (behavior === "blank" ? "" : source.title),
    images: source.images.map((item) => ({
      ...item,
      caption:
        (item.id ? overlay?.images?.[item.id]?.caption : undefined) ??
        (behavior === "blank" ? "" : item.caption),
    })),
  };
}

function transformPlaces(
  source: PlacesConfig | undefined,
  overlay: InvitationTranslationOverlay["places"],
  behavior: MissingTranslationBehavior,
): PlacesConfig | undefined {
  if (!source) return undefined;
  return {
    ...source,
    sections: source.sections.map((section) => {
      const translated = overlay?.sections?.[section.id];
      return {
        ...section,
        title: translated?.title ?? (behavior === "blank" ? "" : section.title),
        items: section.items.map((item) => ({
          ...item,
          title:
            translated?.items?.[item.id]?.title ??
            (behavior === "blank" ? "" : item.title),
          description:
            translated?.items?.[item.id]?.description ??
            (behavior === "blank" ? "" : item.description),
        })),
      };
    }),
  };
}

function transformParents(
  source: ParentsInfo | undefined,
  overlay: InvitationTranslationOverlay["parents"],
  behavior: MissingTranslationBehavior,
): ParentsInfo | undefined {
  if (!source) return undefined;
  return {
    ...source,
    blessingMessage:
      overlay?.blessingMessage ??
      (behavior === "blank" ? "" : source.blessingMessage),
    inviteMessage:
      overlay?.inviteMessage ??
      (behavior === "blank" ? "" : source.inviteMessage),
  };
}

function transformOurStory(
  source: OurStory | undefined,
  overlay: InvitationTranslationOverlay["ourStory"],
  behavior: MissingTranslationBehavior,
): OurStory | undefined {
  if (!source) return undefined;
  return {
    ...source,
    title: overlay?.title ?? (behavior === "blank" ? "" : source.title),
    description:
      overlay?.description ?? (behavior === "blank" ? "" : source.description),
  };
}

function transformRsvp(
  source: InvitationData["rsvp"],
  overlay: InvitationTranslationOverlay["rsvpCustomFields"],
  behavior: MissingTranslationBehavior,
): InvitationData["rsvp"] {
  return {
    ...source,
    customFields: source.customFields?.map((field) => {
      const translated = overlay?.[field.id];
      return {
        ...field,
        label: translated?.label ?? (behavior === "blank" ? "" : field.label),
        options: field.options?.map((option) => ({
          ...option,
          label:
            translated?.options?.[option.id]?.label ??
            (behavior === "blank" ? "" : option.label),
        })),
      };
    }),
  };
}

function transformInvitationText(
  source: InvitationData,
  overlay: InvitationTranslationOverlay | undefined,
  behavior: MissingTranslationBehavior,
): InvitationData {
  return {
    ...source,
    quote: overlay?.quote ?? (behavior === "blank" ? "" : source.quote),
    heroTopText:
      overlay?.heroTopText ?? (behavior === "blank" ? "" : source.heroTopText),
    location: transformLocation(source.location, overlay?.location, behavior),
    location2: source.location2
      ? transformLocation(source.location2, overlay?.location2, behavior)
      : undefined,
    schedule: transformSchedule(source.schedule, overlay?.schedule, behavior),
    dressCode: transformDressCode(
      source.dressCode,
      overlay?.dressCode,
      behavior,
    ),
    giftRegistry: transformGiftRegistry(
      source.giftRegistry,
      overlay?.giftRegistry,
      behavior,
    ),
    heroTextLayer: transformHeroTextLayer(
      source.heroTextLayer,
      overlay?.heroTextBlocks,
      behavior,
    ),
    faqs: transformFaqs(source.faqs, overlay?.faqs, behavior),
    guestGuide: transformGuestGuide(
      source.guestGuide,
      overlay?.guestGuideItems,
      behavior,
    ),
    coupleGallery: transformGallery(
      source.coupleGallery,
      overlay?.coupleGallery,
      behavior,
    ),
    places: transformPlaces(source.places, overlay?.places, behavior),
    parents: transformParents(source.parents, overlay?.parents, behavior),
    ourStory: transformOurStory(source.ourStory, overlay?.ourStory, behavior),
    rsvp: transformRsvp(source.rsvp, overlay?.rsvpCustomFields, behavior),
    customTexts: transformCustomTexts(
      source.customTexts,
      overlay?.customTexts,
      behavior,
    ),
  };
}

function byId<T extends { id?: string }>(
  items: T[] | undefined,
): Map<string, T> {
  return new Map(
    (items ?? [])
      .filter((item): item is T & { id: string } => Boolean(item.id))
      .map((item) => [item.id, item]),
  );
}

function restoreScheduleText(
  source: ScheduleEvent[],
  draft: ScheduleEvent[],
): ScheduleEvent[] {
  const drafts = byId(draft);
  return source.map((item) => {
    const shared = item.id ? drafts.get(item.id) : undefined;
    return {
      ...item,
      ...shared,
      id: item.id,
      label: item.label,
      venue: item.venue,
    };
  });
}

function restoreDressCodeText(source: DressCode, draft: DressCode): DressCode {
  const draftPalette = byId(draft.ladies?.palette);
  return {
    ...source,
    ...draft,
    text: source.text,
    title: source.title,
    intro: source.intro,
    ladies: source.ladies
      ? {
          ...source.ladies,
          ...draft.ladies,
          label: source.ladies.label,
          note: source.ladies.note,
          palette: source.ladies.palette?.map((item) => {
            const shared = item.id ? draftPalette.get(item.id) : undefined;
            return {
              ...item,
              ...shared,
              id: item.id,
              name: item.name,
            };
          }),
        }
      : undefined,
    gentlemen: source.gentlemen
      ? {
          ...source.gentlemen,
          ...draft.gentlemen,
          label: source.gentlemen.label,
          note: source.gentlemen.note,
        }
      : undefined,
    reservedNote: source.reservedNote,
  };
}

function restoreGiftRegistryText(
  source: GiftRegistry,
  draft: GiftRegistry,
): GiftRegistry {
  const draftItems = byId(draft.items);
  const draftBank = byId(draft.bankTransfer);
  return {
    ...source,
    ...draft,
    text: source.text,
    bankTransferText: source.bankTransferText,
    items: source.items?.map((item) => ({
      ...item,
      ...draftItems.get(item.id),
      id: item.id,
      name: item.name,
    })),
    bankTransfer: source.bankTransfer?.map((item) => ({
      ...item,
      ...draftBank.get(item.id),
      id: item.id,
      label: item.label,
    })),
  };
}

function restoreHeroText(
  source: HeroTextLayer | undefined,
  draft: HeroTextLayer | undefined,
): HeroTextLayer | undefined {
  if (!source) return undefined;
  const draftBlocks = byId(draft?.blocks);
  return {
    ...source,
    ...draft,
    blocks: source.blocks.map((block) => ({
      ...block,
      ...draftBlocks.get(block.id),
      id: block.id,
      content: block.content,
    })),
  };
}

function restoreFaqText(
  source: FAQItem[] | undefined,
  draft: FAQItem[] | undefined,
): FAQItem[] | undefined {
  const drafts = byId(draft);
  return source?.map((item) => {
    const shared = item.id ? drafts.get(item.id) : undefined;
    return {
      ...item,
      ...shared,
      id: item.id,
      question: item.question,
      answer: item.answer,
    };
  });
}

function restoreGuestGuideText(
  source: GuestGuide | undefined,
  draft: GuestGuide | undefined,
): GuestGuide | undefined {
  if (!source) return undefined;
  const drafts = byId(draft?.items);
  return {
    ...source,
    ...draft,
    items: source.items.map((item) => ({
      ...item,
      ...drafts.get(item.id),
      id: item.id,
      label: item.label,
    })),
  };
}

function restoreGalleryText(
  source: CoupleGallery | undefined,
  draft: CoupleGallery | undefined,
): CoupleGallery | undefined {
  if (!source) return undefined;
  const drafts = byId(draft?.images);
  return {
    ...source,
    ...draft,
    title: source.title,
    images: source.images.map((item) => {
      const shared = item.id ? drafts.get(item.id) : undefined;
      return {
        ...item,
        ...shared,
        id: item.id,
        caption: item.caption,
      };
    }),
  };
}

function restorePlacesText(
  source: PlacesConfig | undefined,
  draft: PlacesConfig | undefined,
): PlacesConfig | undefined {
  if (!source) return undefined;
  const draftSections = byId(draft?.sections);
  return {
    ...source,
    ...draft,
    sections: source.sections.map((section) => {
      const draftSection = draftSections.get(section.id);
      const draftItems = byId(draftSection?.items);
      return {
        ...section,
        ...draftSection,
        id: section.id,
        title: section.title,
        items: section.items.map((item) => ({
          ...item,
          ...draftItems.get(item.id),
          id: item.id,
          title: item.title,
          description: item.description,
        })),
      };
    }),
  };
}

function restoreRsvpText(
  source: InvitationData["rsvp"],
  draft: InvitationData["rsvp"],
): InvitationData["rsvp"] {
  const draftFields = byId(draft.customFields);
  return {
    ...source,
    ...draft,
    customFields: source.customFields?.map((field) => {
      const draftField = draftFields.get(field.id);
      const draftOptions = byId(draftField?.options);
      return {
        ...field,
        ...draftField,
        id: field.id,
        label: field.label,
        options: field.options?.map((option) => ({
          ...option,
          ...draftOptions.get(option.id),
          id: option.id,
          label: option.label,
        })),
      };
    }),
  };
}

function restorePortugueseText(
  source: InvitationData,
  draft: InvitationData,
): InvitationData {
  return {
    ...source,
    ...draft,
    quote: source.quote,
    heroTopText: source.heroTopText,
    location: {
      ...source.location,
      ...draft.location,
      name: source.location.name,
      address: source.location.address,
    },
    location2: source.location2
      ? {
          ...source.location2,
          ...draft.location2,
          name: source.location2.name,
          address: source.location2.address,
        }
      : undefined,
    schedule: restoreScheduleText(source.schedule, draft.schedule),
    dressCode: restoreDressCodeText(source.dressCode, draft.dressCode),
    giftRegistry: restoreGiftRegistryText(
      source.giftRegistry,
      draft.giftRegistry,
    ),
    heroTextLayer: restoreHeroText(source.heroTextLayer, draft.heroTextLayer),
    faqs: restoreFaqText(source.faqs, draft.faqs),
    guestGuide: restoreGuestGuideText(source.guestGuide, draft.guestGuide),
    coupleGallery: restoreGalleryText(
      source.coupleGallery,
      draft.coupleGallery,
    ),
    places: restorePlacesText(source.places, draft.places),
    parents: source.parents
      ? {
          ...source.parents,
          ...draft.parents,
          blessingMessage: source.parents.blessingMessage,
          inviteMessage: source.parents.inviteMessage,
        }
      : undefined,
    ourStory: source.ourStory
      ? {
          ...source.ourStory,
          ...draft.ourStory,
          title: source.ourStory.title,
          description: source.ourStory.description,
        }
      : undefined,
    rsvp: restoreRsvpText(source.rsvp, draft.rsvp),
    customTexts: source.customTexts,
    translations: source.translations,
  };
}

function recordById<T extends { id?: string }, V>(
  items: T[] | undefined,
  read: (item: T) => V,
): Record<string, V> | undefined {
  if (!items) return undefined;
  const result: Record<string, V> = {};
  for (const item of items) {
    if (item.id) result[item.id] = read(item);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function extractOverlay(draft: InvitationData): InvitationTranslationOverlay {
  return {
    quote: draft.quote,
    heroTopText: draft.heroTopText,
    location: {
      name: draft.location.name,
      address: draft.location.address,
    },
    location2: draft.location2
      ? { name: draft.location2.name, address: draft.location2.address }
      : undefined,
    schedule: recordById(draft.schedule, (item) => ({
      label: item.label,
      venue: item.venue,
    })),
    dressCode: {
      text: draft.dressCode.text,
      title: draft.dressCode.title,
      intro: draft.dressCode.intro,
      ladies: draft.dressCode.ladies
        ? {
            label: draft.dressCode.ladies.label,
            note: draft.dressCode.ladies.note,
          }
        : undefined,
      gentlemen: draft.dressCode.gentlemen
        ? {
            label: draft.dressCode.gentlemen.label,
            note: draft.dressCode.gentlemen.note,
          }
        : undefined,
      reservedNote: draft.dressCode.reservedNote,
      palette: recordById(draft.dressCode.ladies?.palette, (item) => ({
        name: item.name,
      })),
    },
    giftRegistry: {
      text: draft.giftRegistry.text,
      bankTransferText: draft.giftRegistry.bankTransferText,
      items: recordById(draft.giftRegistry.items, (item) => ({
        name: item.name,
      })),
      bankTransfer: recordById(draft.giftRegistry.bankTransfer, (item) => ({
        label: item.label,
      })),
    },
    heroTextBlocks: recordById(draft.heroTextLayer?.blocks, (block) => ({
      content: block.content,
    })),
    faqs: recordById(draft.faqs, (item) => ({
      question: item.question,
      answer: item.answer,
    })),
    guestGuideItems: recordById(draft.guestGuide?.items, (item) => ({
      label: item.label,
    })),
    coupleGallery: draft.coupleGallery
      ? {
          title: draft.coupleGallery.title,
          images: recordById(draft.coupleGallery.images, (item) => ({
            caption: item.caption,
          })),
        }
      : undefined,
    places: draft.places
      ? {
          sections: recordById(draft.places.sections, (section) => ({
            title: section.title,
            items: recordById(section.items, (item) => ({
              title: item.title,
              description: item.description,
            })),
          })),
        }
      : undefined,
    parents: draft.parents
      ? {
          blessingMessage: draft.parents.blessingMessage,
          inviteMessage: draft.parents.inviteMessage,
        }
      : undefined,
    ourStory: draft.ourStory
      ? {
          title: draft.ourStory.title,
          description: draft.ourStory.description,
        }
      : undefined,
    rsvpCustomFields: recordById(draft.rsvp.customFields, (field) => ({
      label: field.label,
      options: recordById(field.options, (option) => ({
        label: option.label,
      })),
    })),
    customTexts: draft.customTexts,
  };
}

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

export function sanitizeInvitationTranslations(
  value: unknown,
): InvitationTranslations | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const result: InvitationTranslations = {};
  for (const locale of TRANSLATION_LOCALES) {
    const overlay = sanitizeOverlay(input[locale]);
    if (overlay) result[locale] = overlay;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

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
  return overlay
    ? transformInvitationText(source, overlay, "fallback")
    : source;
}

export function buildInvitationTranslationDraft(
  source: InvitationData,
  locale: AppLocale,
): InvitationData {
  if (!isTranslationLocale(locale)) return source;
  return transformInvitationText(
    source,
    getInvitationTranslationOverlay(source, locale),
    "blank",
  );
}

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
