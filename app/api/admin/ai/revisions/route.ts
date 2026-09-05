import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { listRevisionsForInvitation } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  const inv = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  return NextResponse.json({
    revisions: await listRevisionsForInvitation(inv.id),
  });
}
