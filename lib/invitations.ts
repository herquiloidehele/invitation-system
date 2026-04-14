import { prisma } from "./db";
import type {
  CustomTexts,
  ImageSettingsMap,
  InvitationData,
  InvitationStyles,
  InvitationType,
  LocationInfo,
  OurStory,
  ParentsInfo,
  SectionImages,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type InvitationWithModel = {
  id: string;
  slug: string;
  modelId: string;
  model: { component: string };
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
  videoUrl: string | null;
  faqs: unknown;
  guestGuide: unknown;
  cinematicImageUrl: string | null;
  sectionImages: unknown;
  parents: unknown;
  ourStory: unknown;
  styles: unknown;
  invitationType: string;
  externalLink: string | null;
  imageSettings: unknown;
  customTexts: unknown;
};

function toInvitationData(row: InvitationWithModel): InvitationData {
  return {
    slug: row.slug,
    modelId: row.modelId,
    modelComponent: row.model.component,
    styles: row.styles as InvitationStyles,
    couple: row.couple as InvitationData["couple"],
    date: row.date as InvitationData["date"],
    quote: row.quote,
    location: row.location as InvitationData["location"],
    location2: (row.location2 as LocationInfo | null) ?? undefined,
    rsvp: row.rsvp as InvitationData["rsvp"],
    schedule: row.schedule as InvitationData["schedule"],
    dressCode: row.dressCode as InvitationData["dressCode"],
    giftRegistry: row.giftRegistry as InvitationData["giftRegistry"],
    audio: row.audio as InvitationData["audio"],
    heroImage: row.heroImage,
    videoUrl: row.videoUrl ?? undefined,
    faqs: (row.faqs as InvitationData["faqs"]) ?? undefined,
    guestGuide: (row.guestGuide as InvitationData["guestGuide"]) ?? undefined,
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    sectionImages: (row.sectionImages as SectionImages | null) ?? undefined,
    parents: (row.parents as ParentsInfo | null) ?? undefined,
    ourStory: (row.ourStory as OurStory | null) ?? undefined,
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    externalLink: row.externalLink ?? undefined,
    imageSettings: (row.imageSettings as ImageSettingsMap | null) ?? undefined,
    customTexts: (row.customTexts as CustomTexts | null) ?? undefined,
  };
}

const includeModel = { model: { select: { component: true } } } as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getInvitation(
  slug: string,
): Promise<InvitationData | null> {
  const row = await prisma.invitation.findUnique({
    where: { slug },
    include: includeModel,
  });
  if (!row) return null;
  return toInvitationData(row as unknown as InvitationWithModel);
}

export async function getAllInvitations(): Promise<InvitationData[]> {
  const rows = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeModel,
  });
  return (rows as unknown as InvitationWithModel[]).map(toInvitationData);
}

/**
 * Get raw Prisma rows (useful for admin pages that need id, createdAt, etc.)
 */
export async function getAllInvitationRows() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeModel,
  });
}

export async function getInvitationById(id: string) {
  return prisma.invitation.findUnique({
    where: { id },
    include: includeModel,
  });
}
