import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatLandingPrice } from "@/lib/landing-features";
import { resolveLandingGalleryMetadata } from "@/lib/landing-gallery-metadata";
import {
  normalizeLandingCustomizationLevel,
  type LandingCustomizationLevel,
} from "@/lib/landing-customization";

type PickableItem = {
  kind: "invitation" | "save_the_date";
  id: string;
  slug: string;
  title: string;
  eventType: string | null;
  landingImageUrl: string | null;
  priceLabel: string | null;
  customizationLevel: LandingCustomizationLevel;
};

export async function GET() {
  const [invitations, saveTheDates] = await Promise.all([
    prisma.invitation.findMany({
      where: { isDemo: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        couple: true,
        eventType: true,
        landingModelName: true,
        landingImageUrl: true,
        heroImage: true,
        priceFromCents: true,
        currency: true,
        landingCustomizationLevel: true,
      },
    }),
    prisma.saveTheDate.findMany({
      where: { isDemo: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        couple: true,
        landingModelName: true,
        landingImageUrl: true,
        priceFromCents: true,
        currency: true,
        landingCustomizationLevel: true,
      },
    }),
  ]);

  const items: PickableItem[] = [
    ...invitations.map((row) => ({
      kind: "invitation" as const,
      id: row.id,
      slug: row.slug,
      title: resolveLandingGalleryMetadata(row).title,
      couple: resolveLandingGalleryMetadata(row).couple,
      eventType: row.eventType ?? null,
      landingImageUrl: row.landingImageUrl ?? row.heroImage ?? null,
      priceLabel: formatLandingPrice(row.priceFromCents, row.currency),
      customizationLevel: normalizeLandingCustomizationLevel(
        row.landingCustomizationLevel,
      ),
    })),
    ...saveTheDates.map((row) => ({
      kind: "save_the_date" as const,
      id: row.id,
      slug: row.slug,
      title: resolveLandingGalleryMetadata(row).title,
      couple: resolveLandingGalleryMetadata(row).couple,
      eventType: null,
      landingImageUrl: row.landingImageUrl,
      priceLabel: formatLandingPrice(row.priceFromCents, row.currency),
      customizationLevel: normalizeLandingCustomizationLevel(
        row.landingCustomizationLevel,
      ),
    })),
  ];

  return NextResponse.json(items);
}
