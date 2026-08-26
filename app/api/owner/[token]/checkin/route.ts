import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCheckInProgress } from "@/lib/checkin-service";

async function resolveOwner(token: string) {
  return prisma.invitation.findUnique({
    where: { ownerToken: token },
    select: { slug: true, checkInEnabled: true },
  });
}

export async function GET(
  _request: NextRequest,
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
  const progress = await getCheckInProgress(inv.slug);
  return NextResponse.json(progress);
}
