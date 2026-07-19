import { cache } from "react";
import { prisma } from "./db";
import {
  normalizeInvitationLocales,
  sanitizeInvitationTranslations,
} from "./invitation-translations";
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
  guestMessageTemplate: string | null;
  socialPreview: unknown;
};

// Maps a Prisma Invitation row into InvitationData for the PUBLIC rendered page.
// NOTE: the admin edit form uses a SEPARATE mapper, `toAdminInvitationInitialData`
// in `lib/invitation-admin-initial-data.ts`. A new persisted field must be added to
// BOTH. Full checklist: docs/invitation-data-field-checklist.md
function toInvitationData(row: InvitationWithTheme): InvitationData {
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
    guestMessageTemplate: row.guestMessageTemplate ?? undefined,
    socialPreview:
      (row.socialPreview as InvitationData["socialPreview"]) ?? undefined,
  };
}

const includeTheme = { theme: { select: { name: true } } } as const;

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
