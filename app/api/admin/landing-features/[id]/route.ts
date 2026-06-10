import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { landingFeatureInclude } from "@/lib/landing-features";

const CATEGORIES = new Set([
  "wedding",
  "save_the_date",
  "baptism",
  "anniversary",
  "engagement",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const data: {
    enabled?: boolean;
    position?: number;
    galleryCategory?: string | null;
  } = {};

  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.position === "number") data.position = body.position;
  if (typeof body.galleryCategory === "string") {
    if (!CATEGORIES.has(body.galleryCategory)) {
      return NextResponse.json(
        { error: "Invalid galleryCategory" },
        { status: 400 },
      );
    }
    data.galleryCategory = body.galleryCategory;
  }

  const row = await prisma.landingFeature.update({
    where: { id },
    data,
    include: landingFeatureInclude,
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.landingFeature.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
