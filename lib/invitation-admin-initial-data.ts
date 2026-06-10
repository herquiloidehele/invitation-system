import type { PriceOverrides } from "@/lib/currency/template-price";
import type {
  CardStyleOverrides,
  CoupleGallery,
  ExternalCountdownConfig,
  HeroOverlayConfig,
  HeroScrollIndicatorConfig,
  ImageSettingsMap,
  InvitationData,
  InvitationEventType,
  InvitationType,
  OurStory,
  ParentsInfo,
  SaveDateStyle,
  ScheduleStyle,
  SectionImages,
  TextStyleOverrides,
} from "./types";

type AdminInvitationInitialDataRow = {
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
  videoUrl: string | null;
  videoPoster: string | null;
  curtainVideoUrl: string | null;
  curtainVideoPoster: string | null;
  heroRevealSeconds: number | null;
  heroTopText: string | null;
  heroTapPrompt: boolean;
  faqs: unknown;
  envelope: unknown;
  guestGuide: unknown;
  saveDateStyle: string | null;
  cinematicImageUrl: string | null;
  sectionImages: unknown;
  coupleGallery: unknown;
  places: unknown;
  parents: unknown;
  ourStory: unknown;
  scratchReveal: unknown;
  heroConfetti: unknown;
  countdown: unknown;
  personalGuestCard: unknown;
  textStyles: unknown;
  cardStyles: unknown;
  imageSettings: unknown;
  eventType: string | null;
  invitationType: string;
  externalLink: string | null;
  isDemo: boolean;
  guestManagementEnabled: boolean;
  guestMessageTemplate: string | null;
  socialPreview: unknown;
  priceFromCents: number | null;
  discountPriceFromCents: number | null;
  currency: string | null;
  priceOverrides: unknown;
  landingModelName: string | null;
  landingImageUrl: string | null;
  landingDescription: string | null;
  landingSubtitle: string | null;
};

export function toAdminInvitationInitialData(
  row: AdminInvitationInitialDataRow,
): InvitationData & { id: string } {
  return {
    id: row.id,
    slug: row.slug,
    themeId: row.themeId,
    template: row.theme.name,
    couple: row.couple as InvitationData["couple"],
    date: row.date as InvitationData["date"],
    quote: row.quote,
    location: row.location as InvitationData["location"],
    location2:
      (row.location2 as InvitationData["location2"] | null) ?? undefined,
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
    videoUrl: row.videoUrl ?? undefined,
    videoPoster: row.videoPoster ?? undefined,
    curtainVideoUrl: row.curtainVideoUrl ?? undefined,
    curtainVideoPoster: row.curtainVideoPoster ?? undefined,
    heroRevealSeconds: row.heroRevealSeconds ?? undefined,
    heroTopText: row.heroTopText ?? undefined,
    heroTapPrompt: row.heroTapPrompt,
    faqs: (row.faqs as InvitationData["faqs"] | null) ?? undefined,
    envelope: (row.envelope as InvitationData["envelope"] | null) ?? undefined,
    guestGuide:
      (row.guestGuide as InvitationData["guestGuide"] | null) ?? undefined,
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    sectionImages: (row.sectionImages as SectionImages | null) ?? undefined,
    coupleGallery: (row.coupleGallery as CoupleGallery | null) ?? undefined,
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
    textStyles: (row.textStyles as TextStyleOverrides | null) ?? undefined,
    cardStyles: (row.cardStyles as CardStyleOverrides | null) ?? undefined,
    imageSettings: (row.imageSettings as ImageSettingsMap | null) ?? undefined,
    eventType: (row.eventType as InvitationEventType | null) ?? "wedding",
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    externalLink: row.externalLink ?? undefined,
    isDemo: row.isDemo,
    guestManagementEnabled: row.guestManagementEnabled,
    guestMessageTemplate: row.guestMessageTemplate ?? undefined,
    socialPreview:
      (row.socialPreview as InvitationData["socialPreview"] | null) ??
      undefined,
    priceFromCents: row.priceFromCents,
    discountPriceFromCents: row.discountPriceFromCents,
    currency: row.currency,
    priceOverrides: (row.priceOverrides as PriceOverrides | null) ?? null,
    landingModelName: row.landingModelName,
    landingImageUrl: row.landingImageUrl,
    landingDescription: row.landingDescription,
    landingSubtitle: row.landingSubtitle,
  };
}
