import { prisma } from "./db";
import type { InvitationData, TemplateName } from "./types";

/**
 * Convert a Prisma Invitation row (with Json fields) into the
 * app-level InvitationData shape expected by all components.
 */
function toInvitationData(row: {
  slug: string;
  template: string;
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
  envelope: unknown;
}): InvitationData {
  return {
    slug: row.slug,
    template: row.template as TemplateName,
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
    envelope: row.envelope as InvitationData["envelope"],
  };
}

export async function getInvitation(
  slug: string,
): Promise<InvitationData | null> {
  const row = await prisma.invitation.findUnique({ where: { slug } });
  if (!row) return null;
  return toInvitationData(row);
}

export async function getAllInvitations(): Promise<InvitationData[]> {
  const rows = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toInvitationData);
}

/**
 * Get raw Prisma rows (useful for admin pages that need id, createdAt, etc.)
 */
export async function getAllInvitationRows() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvitationById(id: string) {
  return prisma.invitation.findUnique({ where: { id } });
}
