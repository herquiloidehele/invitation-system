import { Prisma } from "@/lib/generated/prisma/client";
import { PREDEFINED_GUIDE_ITEMS } from "@/lib/guest-guide";
import { buildInvitationDateInfo } from "@/lib/invitation-default-date";
import {
  buildInvitationMonogram,
  buildInvitationSlug,
} from "@/lib/invitation-event-types";
import { sanitizeJsonField } from "@/lib/json-sanitize";
import type {
  AudioConfig,
  GuestGuideItem,
  InvitationData,
  LocationInfo,
  ParentsInfo,
} from "@/lib/types";
import type { IntakeAnswers, IntakeLocationAnswer } from "./catalog";

// ---------------------------------------------------------------------------
// Turning intake answers into a customer record.
//
// Pure functions: the apply route owns the database (theme copy, slug lookup,
// transaction). Answers may come from a draft, so every value is optional
// and falls back to an empty value or to the demo's own setting.
// ---------------------------------------------------------------------------

function clean(value: string | undefined | null): string {
  return value?.trim() ?? "";
}

function newId(): string {
  return globalThis.crypto.randomUUID();
}

/** Base slug from the customer's names, following the admin's slug rules. */
export function intakeSlugBase(answers: IntakeAnswers): string {
  const event = answers.event;
  const slug = buildInvitationSlug({
    eventType: event?.type ?? "wedding",
    primaryName: clean(event?.primaryName),
    secondaryName: clean(event?.secondaryName),
  });
  return slug || "convite";
}

/** First free slug: base, base-2, base-3… */
export function nextFreeSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function toLocation(location: IntakeLocationAnswer): LocationInfo {
  return {
    name: clean(location.name),
    address: clean(location.address),
    googleMapsUrl: clean(location.mapsUrl),
  };
}

function requestedAudio(answers: IntakeAnswers): AudioConfig {
  // The customer only names the song; the studio uploads the file.
  return {
    enabled: false,
    src: "",
    artist: "",
    title: answers.music?.enabled ? clean(answers.music.text) : "",
  };
}

function guestGuideItems(answers: IntakeAnswers): GuestGuideItem[] {
  const guide = answers.guestGuide;
  const presets = (guide?.presetIds ?? [])
    .map((id) => PREDEFINED_GUIDE_ITEMS.find((item) => item.id === id))
    .filter((item) => item !== undefined)
    .map((item) => ({ ...item }));
  const custom = (guide?.customLabels ?? [])
    .map(clean)
    .filter(Boolean)
    .map(
      (label): GuestGuideItem => ({
        id: newId(),
        label,
        iconType: "lucide",
        iconName: "Star",
      }),
    );
  return [...presets, ...custom];
}

function parentsFrom(
  demo: ParentsInfo | undefined,
  answers: IntakeAnswers,
): ParentsInfo {
  const base: ParentsInfo = demo ?? {
    enabled: false,
    blessingMessage: "",
    inviteMessage: "",
    bridesFather: "",
    bridesMother: "",
    groomsFather: "",
    groomsMother: "",
  };
  const parents = answers.parents;
  const enabled = parents?.enabled === true;
  return {
    ...base,
    enabled,
    bridesFather: enabled ? clean(parents?.bridesFather) : "",
    bridesMother: enabled ? clean(parents?.bridesMother) : "",
    groomsFather: enabled ? clean(parents?.groomsFather) : "",
    groomsMother: enabled ? clean(parents?.groomsMother) : "",
  };
}

/**
 * Overlay intake answers onto a demo copy (the output of
 * buildDuplicateInvitationInitialData). Design and layout stay the demo's;
 * content becomes the customer's; demo text that would leak is cleared.
 */
export function buildInvitationFromIntake(
  demo: InvitationData,
  answers: IntakeAnswers,
  { slug }: { slug: string },
): InvitationData {
  const event = answers.event;
  const eventType = event?.type ?? demo.eventType;
  const primaryName = clean(event?.primaryName);
  const secondaryName = clean(event?.secondaryName);
  const [firstLocation, secondLocation] = answers.locations ?? [];

  return {
    ...demo,
    slug,
    eventType,
    couple: {
      bride: primaryName,
      groom: secondaryName,
      monogram:
        buildInvitationMonogram({ eventType, primaryName, secondaryName }) ||
        primaryName.charAt(0).toUpperCase(),
    },
    date: event?.date
      ? buildInvitationDateInfo(event.date, clean(event.time))
      : demo.date,
    quote: clean(event?.quote) || demo.quote,
    parents: parentsFrom(demo.parents, answers),
    location: firstLocation
      ? toLocation(firstLocation)
      : { name: "", address: "", googleMapsUrl: "" },
    location2: secondLocation ? toLocation(secondLocation) : undefined,
    schedule: (answers.schedule ?? [])
      .filter((row) => clean(row.label))
      .map((row) => ({
        id: newId(),
        time: clean(row.time),
        label: clean(row.label),
        venue: clean(row.venue),
      })),
    dressCode: {
      ...demo.dressCode,
      enabled: answers.dressCode?.enabled === true,
      text: clean(answers.dressCode?.text),
      colors: answers.dressCode?.colors?.length
        ? answers.dressCode.colors
        : undefined,
    },
    giftRegistry: {
      enabled: answers.gifts?.enabled === true,
      text: clean(answers.gifts?.text),
    },
    audio: requestedAudio(answers),
    guestGuide: {
      enabled: answers.guestGuide?.enabled === true,
      items:
        answers.guestGuide?.enabled === true ? guestGuideItems(answers) : [],
    },
    rsvp: {
      ...demo.rsvp,
      enabled: true,
      deadline: clean(answers.rsvp?.deadline) || undefined,
      showDietaryRestrictions: answers.rsvp?.askDietary ?? true,
      acceptingResponses: true,
    },
    faqs: (answers.faqs ?? [])
      .filter((faq) => clean(faq.question) && clean(faq.answer))
      .map((faq) => ({
        id: newId(),
        question: clean(faq.question),
        answer: clean(faq.answer),
      })),
    // Demo copy in other languages and share previews would describe the demo.
    translations: undefined,
    socialPreview: undefined,
    ownerSocialPreview: undefined,
    enabledLocales: ["pt"],
    languageSwitcherEnabled: false,
    isDemo: false,
  };
}

/** The demo Save the Date columns the mapping reads. */
export interface SaveTheDateApplySource {
  themeId: string;
  envelope: unknown;
  textStyles: unknown;
  rsvp: unknown;
  audio: unknown;
  bottomHero: unknown;
  customMessage: string | null;
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Prisma create data for a customer Save the Date built from a demo. */
export function buildSaveTheDateFromIntake(
  demo: SaveTheDateApplySource,
  answers: IntakeAnswers,
  { slug }: { slug: string },
) {
  const event = answers.event;
  const date = event?.date
    ? buildInvitationDateInfo(event.date, clean(event.time))
    : null;
  const place = clean(event?.place);

  return {
    slug,
    theme: { connect: { id: demo.themeId } },
    couple: {
      bride: clean(event?.primaryName),
      groom: clean(event?.secondaryName),
    },
    date: date
      ? {
          iso: date.iso,
          display: date.display,
          day: date.day,
          month: date.month,
          year: date.year,
          time: date.time,
        }
      : {},
    location: place
      ? { name: place, address: "", googleMapsUrl: "" }
      : Prisma.JsonNull,
    location2: Prisma.JsonNull,
    customMessage: clean(event?.quote) || demo.customMessage,
    envelope: sanitizeJsonField(demo.envelope, null),
    textStyles: sanitizeJsonField(demo.textStyles, null),
    rsvp: {
      ...asObject(demo.rsvp),
      enabled: true,
      deadline: clean(answers.rsvp?.deadline) || undefined,
    },
    audio: { ...requestedAudio(answers) },
    bottomHero: sanitizeJsonField(demo.bottomHero, null),
    socialPreview: Prisma.JsonNull,
    ownerSocialPreview: Prisma.JsonNull,
    isDemo: false,
    priceFromCents: null,
    discountPriceFromCents: null,
    currency: "EUR",
    priceOverrides: Prisma.JsonNull,
    landingModelName: null,
    landingImageUrl: null,
    landingDetailImages: Prisma.JsonNull,
    landingDescription: null,
    landingSubtitle: null,
    landingTranslations: Prisma.JsonNull,
    landingCustomizationLevel: "fully_customizable",
  } satisfies Prisma.SaveTheDateCreateInput;
}
