import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicGuestByToken } from "@/lib/guests";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const guest = await getPublicGuestByToken(token);
  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  // Verify the guest's invitation has the feature enabled — otherwise
  // do not surface the personalization at all.
  const invitation = await prisma.invitation.findUnique({
    where: { slug: guest.invitationSlug },
    select: { guestManagementEnabled: true },
  });
  if (!invitation || !invitation.guestManagementEnabled) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(guest);
}
