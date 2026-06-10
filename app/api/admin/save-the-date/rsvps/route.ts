import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/save-the-date/rsvps — List all STD RSVP responses
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const saveTheDateSlug = searchParams.get("saveTheDate") ?? undefined;

  if (!saveTheDateSlug) {
    return NextResponse.json(
      { error: "Missing required saveTheDate filter" },
      { status: 400 },
    );
  }

  try {
    const responses = await prisma.saveTheDateRsvpResponse.findMany({
      where: { saveTheDateSlug },
      orderBy: { submittedAt: "desc" },
      include: {
        saveTheDate: {
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
    console.error("[Admin API] Error listing STD RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch STD RSVP responses" },
      { status: 500 },
    );
  }
}
