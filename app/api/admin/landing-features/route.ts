import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    orderBy: [{ section: "asc" }, { position: "asc" }],
    include: { invitation: true, saveTheDate: true },
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
  } = body as {
    section?: string;
    galleryCategory?: string | null;
    position?: number;
    enabled?: boolean;
    invitationId?: string | null;
    saveTheDateId?: string | null;
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

  if (section === "hero") {
    await prisma.landingFeature.deleteMany({ where: { section: "hero" } });
  }

  const row = await prisma.landingFeature.create({
    data: {
      section,
      galleryCategory: section === "gallery" ? (galleryCategory ?? null) : null,
      position: typeof position === "number" ? position : 0,
      enabled: enabled !== false,
      invitationId: invitationId ?? null,
      saveTheDateId: saveTheDateId ?? null,
    },
    include: { invitation: true, saveTheDate: true },
  });

  return NextResponse.json(row, { status: 201 });
}
