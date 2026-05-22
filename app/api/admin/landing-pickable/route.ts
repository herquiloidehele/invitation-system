import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatLandingPrice } from "@/lib/landing-features";

type PickableItem = {
  kind: "invitation" | "save_the_date";
  id: string;
  slug: string;
  title: string;
  eventType: string | null;
  landingImageUrl: string | null;
  priceLabel: string | null;
};

function readCoupleString(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const couple = value as Record<string, unknown>;
  const bride = typeof couple.bride === "string" ? couple.bride : "";
  const groom = typeof couple.groom === "string" ? couple.groom : "";
  return [bride, groom].filter(Boolean).join(" & ");
}

export async function GET() {
  const [invitations, saveTheDates] = await Promise.all([
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        couple: true,
        eventType: true,
        landingImageUrl: true,
        heroImage: true,
        priceFromCents: true,
        currency: true,
      },
    }),
    prisma.saveTheDate.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        couple: true,
        landingImageUrl: true,
        priceFromCents: true,
        currency: true,
      },
    }),
  ]);

  const items: PickableItem[] = [
    ...invitations.map((row) => ({
      kind: "invitation" as const,
      id: row.id,
      slug: row.slug,
      title: readCoupleString(row.couple),
      eventType: row.eventType ?? null,
      landingImageUrl: row.landingImageUrl ?? row.heroImage ?? null,
      priceLabel: formatLandingPrice(row.priceFromCents, row.currency),
    })),
    ...saveTheDates.map((row) => ({
      kind: "save_the_date" as const,
      id: row.id,
      slug: row.slug,
      title: readCoupleString(row.couple),
      eventType: null,
      landingImageUrl: row.landingImageUrl,
      priceLabel: formatLandingPrice(row.priceFromCents, row.currency),
    })),
  ];

  return NextResponse.json(items);
}
