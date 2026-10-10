import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LANDING_FEATURE_ORDER_BY } from "@/lib/landing-feature-order";
import { landingFeatureInclude } from "@/lib/landing-features";
import { parseNewUntilInput } from "@/lib/landing-new-badge";

const SECTIONS = new Set(["hero", "gallery", "live_demo", "best_seller"]);
const CATEGORIES = new Set([
  "wedding",
  "save_the_date",
  "baptism",
  "anniversary",
  "engagement",
]);

export async function GET() {
  const rows = await prisma.landingFeature.findMany({
    orderBy: [{ section: "asc" }, ...LANDING_FEATURE_ORDER_BY],
    include: landingFeatureInclude,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    section,
    galleryCategory,
    position,
    enabled,
    invitationId,
    saveTheDateId,
    newUntil,
  } = body as {
    section?: string;
    galleryCategory?: string | null;
    position?: number;
    enabled?: boolean;
    invitationId?: string | null;
    saveTheDateId?: string | null;
    newUntil?: string | null;
  };

  if (!section || !SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  if (Boolean(invitationId) === Boolean(saveTheDateId)) {
    return NextResponse.json(
      { error: "Exactly one of invitationId or saveTheDateId is required" },
      { status: 400 },
    );
  }
  if (section === "gallery") {
    if (!galleryCategory || !CATEGORIES.has(galleryCategory)) {
      return NextResponse.json(
        { error: "galleryCategory required when section is 'gallery'" },
        { status: 400 },
      );
    }
  }

  const parsedNewUntil = parseNewUntilInput(newUntil);
  if (!parsedNewUntil.ok) {
    return NextResponse.json({ error: "Invalid newUntil" }, { status: 400 });
  }

  if (section === "hero") {
    await prisma.landingFeature.deleteMany({ where: { section: "hero" } });
  }

  // New rows go to the end of their section unless a position is given.
  let nextPosition = position;
  if (typeof nextPosition !== "number") {
    const last = await prisma.landingFeature.aggregate({
      where: { section },
      _max: { position: true },
    });
    nextPosition = (last._max.position ?? -1) + 1;
  }

  const row = await prisma.landingFeature.create({
    data: {
      section,
      galleryCategory: section === "gallery" ? (galleryCategory ?? null) : null,
      position: nextPosition,
      enabled: enabled !== false,
      invitationId: invitationId ?? null,
      saveTheDateId: saveTheDateId ?? null,
      newUntil: parsedNewUntil.value ?? null,
    },
    include: landingFeatureInclude,
  });

  return NextResponse.json(row, { status: 201 });
}
