import { prisma } from "./db";
import type { InvitationData, SaveDateStyle } from "./types";

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
  rsvp: unknown;
  schedule: unknown;
  dressCode: string;
  giftRegistry: unknown;
  audio: unknown;
  heroImage: string;
  videoUrl: string | null;
  faqs: unknown;
  guestGuide: unknown;
  envelope: unknown;
  saveDateStyle: string | null;
  cinematicImageUrl: string | null;
};

function toInvitationData(row: InvitationWithTheme): InvitationData {
  return {
    slug: row.slug,
    themeId: row.themeId,
    template: row.theme.name,
    couple: row.couple as InvitationData["couple"],
    date: row.date as InvitationData["date"],
    quote: row.quote,
    location: row.location as InvitationData["location"],
    rsvp: row.rsvp as InvitationData["rsvp"],
    schedule: row.schedule as InvitationData["schedule"],
    dressCode: row.dressCode,
    giftRegistry: row.giftRegistry as InvitationData["giftRegistry"],
    audio: row.audio as InvitationData["audio"],
    heroImage: row.heroImage,
    videoUrl: row.videoUrl ?? undefined,
    faqs: (row.faqs as InvitationData["faqs"]) ?? undefined,
    guestGuide: (row.guestGuide as InvitationData["guestGuide"]) ?? undefined,
    envelope: row.envelope as InvitationData["envelope"],
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
  };
}

const includeTheme = { theme: { select: { name: true } } } as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getInvitation(
  slug: string,
): Promise<InvitationData | null> {
  const row = await prisma.invitation.findUnique({
    where: { slug },
    include: includeTheme,
  });
  if (!row) return null;
  return toInvitationData(row);
}

export async function getAllInvitations(): Promise<InvitationData[]> {
  const rows = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeTheme,
  });
  return rows.map(toInvitationData);
}

/**
 * Get raw Prisma rows (useful for admin pages that need id, createdAt, etc.)
 */
export async function getAllInvitationRows() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeTheme,
  });
}

export async function getInvitationById(id: string) {
  return prisma.invitation.findUnique({
    where: { id },
    include: includeTheme,
  });
}
