import { prisma } from "@/lib/db";
import { resolveLandingGalleryMetadata } from "@/lib/landing-gallery-metadata";
import { resolveLandingPrice, type LandingPrice } from "@/lib/landing-price";

// Re-exported so existing importers (e.g. the landing-pickable route) keep working.
export { formatLandingPrice } from "@/lib/landing-price";
export type { LandingPrice } from "@/lib/landing-price";

export type GalleryCategory =
  | "wedding"
  | "save_the_date"
  | "baptism"
  | "anniversary"
  | "engagement";

export type GalleryCategoryInput =
  | { kind: "invitation"; eventType: string }
  | { kind: "save_the_date" };

const INVITATION_EVENT_CATEGORY: Record<string, GalleryCategory> = {
  wedding: "wedding",
  baptism: "baptism",
  anniversary: "anniversary",
  engagement: "engagement",
};

export function resolveGalleryCategory(
  input: GalleryCategoryInput,
): GalleryCategory | null {
  if (input.kind === "save_the_date") return "save_the_date";
  return INVITATION_EVENT_CATEGORY[input.eventType] ?? null;
}

// ---------------------------------------------------------------------------
// Server-side data accessors
// ---------------------------------------------------------------------------

export type HeroFeature = {
  title: string;
  href: string;
  imageUrl: string | null;
};

export type GalleryFeature = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  displayDate: string;
  subtitle: string | null;
  description: string | null;
  price: LandingPrice | null;
  category: GalleryCategory;
};

export type LiveDemoFeature = {
  id: string;
  title: string;
  href: string;
};

type AnyJson = Record<string, unknown>;

function readCouple(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const couple = value as AnyJson;
  const bride = typeof couple.bride === "string" ? couple.bride : "";
  const groom = typeof couple.groom === "string" ? couple.groom : "";
  return [bride, groom].filter(Boolean).join(" & ");
}

function readDateDisplay(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const date = value as AnyJson;
  return typeof date.display === "string" ? date.display : "";
}

function invitationHref(slug: string): string {
  return `/${slug}`;
}

function saveTheDateHref(slug: string): string {
  return `/s/${slug}`;
}

export async function getHeroFeature(): Promise<HeroFeature | null> {
  const row = await prisma.landingFeature.findFirst({
    where: { section: "hero", enabled: true },
    orderBy: { updatedAt: "desc" },
    include: { invitation: true, saveTheDate: true },
  });

  if (!row) return null;

  if (row.invitation) {
    return {
      title: readCouple(row.invitation.couple),
      href: invitationHref(row.invitation.slug),
      imageUrl:
        row.invitation.landingImageUrl ?? row.invitation.heroImage ?? null,
    };
  }

  if (row.saveTheDate) {
    return {
      title: readCouple(row.saveTheDate.couple),
      href: saveTheDateHref(row.saveTheDate.slug),
      imageUrl: row.saveTheDate.landingImageUrl ?? null,
    };
  }

  return null;
}

export async function getGalleryFeaturesByCategory(): Promise<
  Record<GalleryCategory, GalleryFeature[]>
> {
  const rows = await prisma.landingFeature.findMany({
    where: { section: "gallery", enabled: true },
    orderBy: { position: "asc" },
    include: { invitation: true, saveTheDate: true },
  });

  const result: Record<GalleryCategory, GalleryFeature[]> = {
    wedding: [],
    save_the_date: [],
    baptism: [],
    anniversary: [],
    engagement: [],
  };

  for (const row of rows) {
    const isInvitation = Boolean(row.invitation);
    const target = row.invitation ?? row.saveTheDate ?? null;
    if (!target) continue;

    const category =
      (row.galleryCategory as GalleryCategory | null) ??
      (row.invitation
        ? resolveGalleryCategory({
            kind: "invitation",
            eventType: row.invitation.eventType,
          })
        : resolveGalleryCategory({ kind: "save_the_date" }));

    if (!category) continue;

    const slug = (target as { slug: string }).slug;
    const heroImage = isInvitation
      ? ((target as { heroImage?: string | null }).heroImage ?? null)
      : null;

    const metadata = resolveLandingGalleryMetadata({
      couple: target.couple,
      landingModelName: target.landingModelName,
      landingDescription: target.landingDescription,
    });

    result[category].push({
      id: row.id,
      title: metadata.title,
      href: isInvitation ? invitationHref(slug) : saveTheDateHref(slug),
      imageUrl: target.landingImageUrl ?? heroImage,
      displayDate: readDateDisplay(target.date),
      subtitle: target.landingSubtitle ?? null,
      description: metadata.description,
      price: resolveLandingPrice(
        target.priceFromCents,
        target.discountPriceFromCents,
        target.currency,
      ),
      category,
    });
  }

  return result;
}

export type BestSellerFeature = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  subtitle: string | null;
  description: string | null;
  price: LandingPrice | null;
};

type BestSellerSourceRow = {
  id: string;
  invitation: {
    slug: string;
    couple: unknown;
    landingImageUrl: string | null;
    heroImage: string | null;
    landingModelName: string | null;
    landingDescription: string | null;
    landingSubtitle: string | null;
    date: unknown;
    priceFromCents: number | null;
    discountPriceFromCents: number | null;
    currency: string;
  } | null;
  saveTheDate: {
    slug: string;
    couple: unknown;
    landingImageUrl: string | null;
    landingModelName: string | null;
    landingDescription: string | null;
    landingSubtitle: string | null;
    date: unknown;
    priceFromCents: number | null;
    discountPriceFromCents: number | null;
    currency: string;
  } | null;
};

export function mapBestSellerRowToFeature(
  row: BestSellerSourceRow,
): BestSellerFeature | null {
  const isInvitation = Boolean(row.invitation);
  const target = row.invitation ?? row.saveTheDate;
  if (!target) return null;

  const slug = target.slug;
  const heroImage = isInvitation ? (row.invitation?.heroImage ?? null) : null;

  const metadata = resolveLandingGalleryMetadata({
    couple: target.couple,
    landingModelName: target.landingModelName,
    landingDescription: target.landingDescription,
  });

  return {
    id: row.id,
    title: metadata.title,
    href: isInvitation ? invitationHref(slug) : saveTheDateHref(slug),
    imageUrl: target.landingImageUrl ?? heroImage,
    subtitle: target.landingSubtitle ?? null,
    description: metadata.description,
    price: resolveLandingPrice(
      target.priceFromCents,
      target.discountPriceFromCents,
      target.currency,
    ),
  };
}

export async function getBestSellerFeatures(): Promise<BestSellerFeature[]> {
  const rows = await prisma.landingFeature.findMany({
    where: { section: "best_seller", enabled: true },
    orderBy: { position: "asc" },
    include: { invitation: true, saveTheDate: true },
  });

  return rows
    .map((row) => mapBestSellerRowToFeature(row))
    .filter((feature): feature is BestSellerFeature => feature !== null);
}

export async function getLiveDemoFeatures(): Promise<LiveDemoFeature[]> {
  const rows = await prisma.landingFeature.findMany({
    where: { section: "live_demo", enabled: true },
    orderBy: { position: "asc" },
    include: { invitation: true, saveTheDate: true },
  });

  return rows
    .map((row) => {
      if (row.invitation) {
        return {
          id: row.id,
          title: readCouple(row.invitation.couple),
          href: invitationHref(row.invitation.slug),
        };
      }
      if (row.saveTheDate) {
        return {
          id: row.id,
          title: readCouple(row.saveTheDate.couple),
          href: saveTheDateHref(row.saveTheDate.slug),
        };
      }
      return null;
    })
    .filter((item): item is LiveDemoFeature => item !== null);
}
