import { cache } from "react";
import { prisma } from "./db";
import {
  normalizeInvitationLocales,
  sanitizeInvitationTranslations,
} from "./invitation-translations";
import { sanitizeLandingTranslations } from "./landing-translations";
import { sanitizeLandingDetailImages } from "./landing-product-details";
import { normalizeOwnerGuestFormMode } from "./owner-guest-form-mode";
import { normalizeCurrency } from "./currency/config";
import { normalizeRenderMode } from "./ai-invitation";
import { publicUrlForKey } from "./s3";
import type {
  CardStyleOverrides,
  CoupleGallery,
  CustomTexts,
  ExternalCountdownConfig,
  HeroOverlayConfig,
  HeroScrollIndicatorConfig,
  HeroTextLayer,
  ImageLayer,
  ImageSettingsMap,
  InvitationData,
  InvitationEventType,
  InvitationType,
  LocationInfo,
  ObjectFit,
  OurStory,
  ParentsInfo,
  SaveDateStyle,
  ScheduleStyle,
  SectionImages,
  SpacingStyleOverrides,
  TextStyleOverrides,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type InvitationWithTheme = {
  id: string;
  slug: string;
  themeId: string;
  theme: { name: string };
  // Optional so shared fixtures (e.g. the admin-mapper row) can omit them; the
  // Prisma query always supplies both, and the mapper handles their absence.
  renderMode?: string;
  activeRevision?: { id: string; bundleKey: string | null } | null;
  couple: unknown;
  date: unknown;
  quote: string;
  location: unknown;
  location2: unknown;
  rsvp: unknown;
  schedule: unknown;
  scheduleStyle: string | null;
  dressCode: unknown;
  giftRegistry: unknown;
  audio: unknown;
  heroImage: string;
  heroHeight: number | null;
  heroOverlay: unknown;
  heroScrollIndicator: unknown;
  heroTextLayer: unknown;
  imageLayer: unknown;
  videoUrl: string | null;
  videoPoster: string | null;
  heroVideoMuted: boolean;
  heroMediaFit: string | null;
  curtainVideoUrl: string | null;
  curtainVideoPoster: string | null;
  heroRevealSeconds: number | null;
  heroTopText: string | null;
  heroTapPrompt: boolean;
  faqs: unknown;
  guestGuide: unknown;
  envelope: unknown;
  saveDateStyle: string | null;
  cinematicImageUrl: string | null;
  saveTheDateBackgroundImageUrl: string | null;
  showCalendarCta: boolean;
  sectionImages: unknown;
  coupleGallery: unknown;
  coverVideos: unknown;
  places: unknown;
  parents: unknown;
  ourStory: unknown;
  scratchReveal: unknown;
  heroConfetti: unknown;
  countdown: unknown;
  personalGuestCard: unknown;
  invitationType: string;
  externalLink: string | null;
  isDemo: boolean;
  textStyles: unknown;
  cardStyles: unknown;
  spacingStyles: unknown;
  imageSettings: unknown;
  customTexts: unknown;
  languageSwitcherEnabled: boolean;
  enabledLocales: string[];
  translations: unknown;
  eventType: string;
  guestManagementEnabled: boolean;
  ownerCanAddGuests: boolean;
  checkInEnabled: boolean;
  qrCodeStyle: unknown;
  ownerGuestFormMode: string;
  guestMessageTemplate: string | null;
  socialPreview: unknown;
  priceFromCents: number | null;
  discountPriceFromCents: number | null;
  currency: string | null;
  priceOverrides: unknown;
  landingModelName: string | null;
  landingImageUrl: string | null;
  landingDetailImages: unknown;
  landingDescription: string | null;
  landingSubtitle: string | null;
  landingTranslations: unknown;
  landingCustomizationLevel: string;
};

// Maps a Prisma Invitation row into InvitationData for the PUBLIC rendered page.
// NOTE: the admin edit form uses a SEPARATE mapper, `toAdminInvitationInitialData`
// in `lib/invitation-admin-initial-data.ts`. A new persisted field must be added to
// BOTH. Full checklist: docs/invitation-data-field-checklist.md
export function toInvitationData(row: InvitationWithTheme): InvitationData {
  return {
    slug: row.slug,
    themeId: row.themeId,
    template: row.theme.name,
    couple: row.couple as InvitationData["couple"],
    date: row.date as InvitationData["date"],
    quote: row.quote,
    location: row.location as InvitationData["location"],
    location2: (row.location2 as LocationInfo | null) ?? undefined,
    rsvp: row.rsvp as InvitationData["rsvp"],
    schedule: row.schedule as InvitationData["schedule"],
    scheduleStyle: (row.scheduleStyle as ScheduleStyle | null) ?? "default",
    dressCode: row.dressCode as InvitationData["dressCode"],
    giftRegistry: row.giftRegistry as InvitationData["giftRegistry"],
    audio: row.audio as InvitationData["audio"],
    heroImage: row.heroImage,
    heroHeight: row.heroHeight ?? undefined,
    heroOverlay: (row.heroOverlay as HeroOverlayConfig | null) ?? undefined,
    heroScrollIndicator:
      (row.heroScrollIndicator as HeroScrollIndicatorConfig | null) ??
      undefined,
    heroTextLayer: (row.heroTextLayer as HeroTextLayer | null) ?? undefined,
    imageLayer: (row.imageLayer as ImageLayer | null) ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    videoPoster: row.videoPoster ?? undefined,
    heroVideoMuted: row.heroVideoMuted,
    heroMediaFit: (row.heroMediaFit as ObjectFit | null) ?? undefined,
    curtainVideoUrl: row.curtainVideoUrl ?? undefined,
    curtainVideoPoster: row.curtainVideoPoster ?? undefined,
    heroRevealSeconds: row.heroRevealSeconds ?? undefined,
    heroTopText: row.heroTopText ?? undefined,
    heroTapPrompt: row.heroTapPrompt,
    faqs: (row.faqs as InvitationData["faqs"]) ?? undefined,
    guestGuide: (row.guestGuide as InvitationData["guestGuide"]) ?? undefined,
    envelope: row.envelope as InvitationData["envelope"],
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    saveTheDateBackgroundImageUrl:
      row.saveTheDateBackgroundImageUrl ?? undefined,
    showCalendarCta: row.showCalendarCta,
    sectionImages: (row.sectionImages as SectionImages | null) ?? undefined,
    coupleGallery: (row.coupleGallery as CoupleGallery | null) ?? undefined,
    coverVideos:
      (row.coverVideos as InvitationData["coverVideos"] | null) ?? undefined,
    places: (row.places as InvitationData["places"] | null) ?? undefined,
    parents: (row.parents as ParentsInfo | null) ?? undefined,
    ourStory: (row.ourStory as OurStory | null) ?? undefined,
    scratchReveal:
      (row.scratchReveal as InvitationData["scratchReveal"] | null) ??
      undefined,
    heroConfetti:
      (row.heroConfetti as InvitationData["heroConfetti"] | null) ?? undefined,
    countdown: (row.countdown as ExternalCountdownConfig | null) ?? undefined,
    personalGuestCard:
      (row.personalGuestCard as InvitationData["personalGuestCard"] | null) ??
      undefined,
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    renderMode: normalizeRenderMode(row.renderMode),
    // PHASE 1 SCAFFOLD: no AiRevision/bundleKey exists yet, so point every ai
    // invitation at the hand-built fixture bundle. Phase 3 replaces this with
    // the publicUrlForKey(row.activeRevision.bundleKey) resolution below.
    aiBundleUrl:
      normalizeRenderMode(row.renderMode) === "ai"
        ? "/ai-bundles/fixture.js"
        : row.activeRevision?.bundleKey
          ? publicUrlForKey(row.activeRevision.bundleKey)
          : null,
    externalLink: row.externalLink ?? undefined,
    isDemo: row.isDemo,
    textStyles: (row.textStyles as TextStyleOverrides | null) ?? undefined,
    cardStyles: (row.cardStyles as CardStyleOverrides | null) ?? undefined,
    spacingStyles:
      (row.spacingStyles as SpacingStyleOverrides | null) ?? undefined,
    imageSettings: (row.imageSettings as ImageSettingsMap | null) ?? undefined,
    customTexts: (row.customTexts as CustomTexts | null) ?? undefined,
    languageSwitcherEnabled: row.languageSwitcherEnabled,
    enabledLocales: normalizeInvitationLocales(row.enabledLocales),
    translations: sanitizeInvitationTranslations(row.translations),
    eventType: (row.eventType as InvitationEventType) ?? "wedding",
    guestManagementEnabled: row.guestManagementEnabled ?? false,
    ownerCanAddGuests: row.ownerCanAddGuests ?? false,
    checkInEnabled: row.checkInEnabled ?? false,
    qrCodeStyle:
      (row.qrCodeStyle as InvitationData["qrCodeStyle"]) ?? undefined,
    ownerGuestFormMode: normalizeOwnerGuestFormMode(row.ownerGuestFormMode),
    guestMessageTemplate: row.guestMessageTemplate ?? undefined,
    socialPreview:
      (row.socialPreview as InvitationData["socialPreview"]) ?? undefined,
    priceFromCents: row.priceFromCents,
    discountPriceFromCents: row.discountPriceFromCents,
    currency: normalizeCurrency(row.currency),
    priceOverrides:
      (row.priceOverrides as InvitationData["priceOverrides"]) ?? null,
    landingModelName: row.landingModelName,
    landingImageUrl: row.landingImageUrl,
    landingDetailImages:
      sanitizeLandingDetailImages(row.landingDetailImages) ?? null,
    landingDescription: row.landingDescription,
    landingSubtitle: row.landingSubtitle,
    landingTranslations:
      sanitizeLandingTranslations(row.landingTranslations) ?? null,
    landingCustomizationLevel:
      row.landingCustomizationLevel === "pre_designed"
        ? "pre_designed"
        : "fully_customizable",
  };
}

const includeTheme = {
  theme: { select: { name: true } },
  activeRevision: { select: { id: true, bundleKey: true } },
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getInvitation = cache(
  async (slug: string): Promise<InvitationData | null> => {
    const row = await prisma.invitation.findUnique({
      where: { slug },
      include: includeTheme,
    });
    if (!row) return null;
    return toInvitationData(row as unknown as InvitationWithTheme);
  },
);

async function getAllInvitations(): Promise<InvitationData[]> {
  const rows = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeTheme,
  });
  return (rows as unknown as InvitationWithTheme[]).map(toInvitationData);
}

/**
 * Get raw Prisma rows (useful for admin pages that need id, createdAt, etc.)
 */
async function getAllInvitationRows() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeTheme,
  });
}

async function getInvitationById(id: string) {
  return prisma.invitation.findUnique({
    where: { id },
    include: includeTheme,
  });
}
