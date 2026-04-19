import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// DELETE /api/admin/save-the-date/rsvps/[id] — Delete a single STD RSVP response
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const existing = await prisma.saveTheDateRsvpResponse.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "RSVP response not found" },
        { status: 404 },
      );
    }

    await prisma.saveTheDateRsvpResponse.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin API] Error deleting STD RSVP response:", error);
    return NextResponse.json(
      { error: "Failed to delete STD RSVP response" },
      { status: 500 },
    );
  }
}
