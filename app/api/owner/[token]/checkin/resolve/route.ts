import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseScannedValue } from "@/lib/checkin";
import { resolveSubject } from "@/lib/checkin-service";

async function resolveOwner(token: string) {
  return prisma.invitation.findUnique({
    where: { ownerToken: token },
    select: { slug: true, checkInEnabled: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const inv = await resolveOwner(token);
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  if (!inv.checkInEnabled) {
    return NextResponse.json(
      { error: "Check-in is disabled for this invitation" },
      { status: 403 },
    );
  }
  const scanned = request.nextUrl.searchParams.get("token") ?? "";
  const parsed = parseScannedValue(scanned);
  if (!parsed) {
    return NextResponse.json({ error: "Empty token" }, { status: 400 });
  }
  const resolved = await resolveSubject(inv.slug, parsed);
  if (!resolved) {
    return NextResponse.json({ error: "Not recognized" }, { status: 404 });
  }
  return NextResponse.json({ pass: resolved.pass });
}
