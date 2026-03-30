import { prisma } from "./db";
import type {
  CardStyleOverrides,
  GiftCategoryData,
  GiftItemData,
  InvitationData,
  InvitationType,
  OurStory,
  ParentsInfo,
  SaveDateStyle,
  SectionImages,
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
  rsvp: unknown;
  schedule: unknown;
  dressCode: unknown;
  giftRegistry: unknown;
  audio: unknown;
  heroImage: string;
  videoUrl: string | null;
  faqs: unknown;
  guestGuide: unknown;
  envelope: unknown;
  saveDateStyle: string | null;
  cinematicImageUrl: string | null;
  sectionImages: unknown;
  parents: unknown;
  ourStory: unknown;
  invitationType: string;
  externalLink: string | null;
  textStyles: unknown;
  cardStyles: unknown;
  giftCategories?: Array<{
    id: string;
    name: string;
    icon: string | null;
    order: number;
    items: Array<{
      id: string;
      categoryId: string;
      name: string;
      imageUrl: string | null;
      price: number | null;
      link: string | null;
      order: number;
    }>;
  }>;
};

function toGiftCategories(
  rows?: InvitationWithTheme["giftCategories"],
): GiftCategoryData[] | undefined {
  if (!rows || rows.length === 0) return undefined;
  return rows
    .sort((a, b) => a.order - b.order)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon ?? undefined,
      order: cat.order,
      items: cat.items
        .sort((a, b) => a.order - b.order)
        .map(
          (item): GiftItemData => ({
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            imageUrl: item.imageUrl ?? undefined,
            price: item.price ?? undefined,
            link: item.link ?? undefined,
            order: item.order,
          }),
        ),
    }));
}

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
    dressCode: row.dressCode as InvitationData["dressCode"],
    giftRegistry: row.giftRegistry as InvitationData["giftRegistry"],
    audio: row.audio as InvitationData["audio"],
    heroImage: row.heroImage,
    videoUrl: row.videoUrl ?? undefined,
    faqs: (row.faqs as InvitationData["faqs"]) ?? undefined,
    guestGuide: (row.guestGuide as InvitationData["guestGuide"]) ?? undefined,
    envelope: row.envelope as InvitationData["envelope"],
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    sectionImages: (row.sectionImages as SectionImages | null) ?? undefined,
    parents: (row.parents as ParentsInfo | null) ?? undefined,
    ourStory: (row.ourStory as OurStory | null) ?? undefined,
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    externalLink: row.externalLink ?? undefined,
    textStyles: (row.textStyles as TextStyleOverrides | null) ?? undefined,
    cardStyles: (row.cardStyles as CardStyleOverrides | null) ?? undefined,
    giftCategories: toGiftCategories(row.giftCategories),
  };
}

const includeTheme = { theme: { select: { name: true } } } as const;

const includeThemeAndGifts = {
  theme: { select: { name: true } },
  giftCategories: {
    orderBy: { order: "asc" as const },
    include: {
      items: { orderBy: { order: "asc" as const } },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getInvitation(
  slug: string,
): Promise<InvitationData | null> {
  const row = await prisma.invitation.findUnique({
    where: { slug },
    include: includeThemeAndGifts,
  });
  if (!row) return null;
  return toInvitationData(row as unknown as InvitationWithTheme);
}

export async function getAllInvitations(): Promise<InvitationData[]> {
  const rows = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: includeTheme,
  });
  return (rows as unknown as InvitationWithTheme[]).map(toInvitationData);
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
    include: includeThemeAndGifts,
  });
}
