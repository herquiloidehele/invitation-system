import type {
  CardStyleOverrides,
  ExternalCountdownConfig,
  ImageSettingsMap,
  InvitationData,
  InvitationEventType,
  InvitationType,
  OurStory,
  ParentsInfo,
  SaveDateStyle,
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
  dressCode: unknown;
  giftRegistry: unknown;
  audio: unknown;
  heroImage: string;
  heroHeight: number | null;
  videoUrl: string | null;
  videoPoster: string | null;
  faqs: unknown;
  envelope: unknown;
  guestGuide: unknown;
  saveDateStyle: string | null;
  cinematicImageUrl: string | null;
  sectionImages: unknown;
  parents: unknown;
  ourStory: unknown;
  countdown: unknown;
  textStyles: unknown;
  cardStyles: unknown;
  imageSettings: unknown;
  eventType: string | null;
  invitationType: string;
  externalLink: string | null;
  isDemo: boolean;
  socialPreview: unknown;
  priceFromCents: number | null;
  currency: string | null;
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
    location2: (row.location2 as InvitationData["location2"] | null) ?? undefined,
    rsvp: row.rsvp as InvitationData["rsvp"],
    schedule: row.schedule as InvitationData["schedule"],
    dressCode: row.dressCode as InvitationData["dressCode"],
    giftRegistry: row.giftRegistry as InvitationData["giftRegistry"],
    audio: row.audio as InvitationData["audio"],
    heroImage: row.heroImage,
    heroHeight: row.heroHeight ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    videoPoster: row.videoPoster ?? undefined,
    faqs: (row.faqs as InvitationData["faqs"] | null) ?? undefined,
    envelope: (row.envelope as InvitationData["envelope"] | null) ?? undefined,
    guestGuide:
      (row.guestGuide as InvitationData["guestGuide"] | null) ?? undefined,
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    sectionImages: (row.sectionImages as SectionImages | null) ?? undefined,
    parents: (row.parents as ParentsInfo | null) ?? undefined,
    ourStory: (row.ourStory as OurStory | null) ?? undefined,
    countdown: (row.countdown as ExternalCountdownConfig | null) ?? undefined,
    textStyles: (row.textStyles as TextStyleOverrides | null) ?? undefined,
    cardStyles: (row.cardStyles as CardStyleOverrides | null) ?? undefined,
    imageSettings: (row.imageSettings as ImageSettingsMap | null) ?? undefined,
    eventType: (row.eventType as InvitationEventType | null) ?? "wedding",
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    externalLink: row.externalLink ?? undefined,
    isDemo: row.isDemo,
    socialPreview:
      (row.socialPreview as InvitationData["socialPreview"] | null) ??
      undefined,
    priceFromCents: row.priceFromCents,
    currency: row.currency,
    landingModelName: row.landingModelName,
    landingImageUrl: row.landingImageUrl,
    landingDescription: row.landingDescription,
    landingSubtitle: row.landingSubtitle,
  };
}
