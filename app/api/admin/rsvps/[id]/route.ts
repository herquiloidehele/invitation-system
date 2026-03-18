import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// DELETE /api/admin/rsvps/[id] — Delete a single RSVP response
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const existing = await prisma.rsvpResponse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "RSVP response not found" },
        { status: 404 },
      );
    }

    await prisma.rsvpResponse.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin API] Error deleting RSVP response:", error);
    return NextResponse.json(
      { error: "Failed to delete RSVP response" },
      { status: 500 },
    );
  }
}
