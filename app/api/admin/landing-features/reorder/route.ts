import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isSingleReorderGroup,
  parseReorderIds,
} from "@/lib/landing-feature-order";

// Rewrites one admin list in the order given, numbering it 0..n-1. Sending the
// whole list (rather than nudging a single row) keeps positions unique in it.
export async function PUT(req: NextRequest) {
  const ids = parseReorderIds(await req.json().catch(() => null));
  if (!ids) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const rows = await prisma.landingFeature.findMany({
    where: { id: { in: ids } },
    select: { section: true, galleryCategory: true },
  });
  if (rows.length !== ids.length) {
    return NextResponse.json({ error: "Unknown feature" }, { status: 404 });
  }
  if (!isSingleReorderGroup(rows)) {
    return NextResponse.json(
      { error: "Features must belong to the same list" },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.landingFeature.update({ where: { id }, data: { position } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
