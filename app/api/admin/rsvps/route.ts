import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/rsvps — List all RSVP responses (optionally filtered by slug)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invitationSlug = searchParams.get("invitation") ?? undefined;

  try {
    const responses = await prisma.rsvpResponse.findMany({
      where: invitationSlug ? { invitationSlug } : undefined,
      orderBy: { submittedAt: "desc" },
      include: {
        invitation: {
          select: {
            id: true,
            slug: true,
            couple: true,
            theme: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("[Admin API] Error listing RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVP responses" },
      { status: 500 },
    );
  }
}
