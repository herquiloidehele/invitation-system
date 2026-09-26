import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/intake/http";

// POST /api/admin/intakes/[id]/viewed — the admin opened the detail page.
// Drives the "Alterado" markers and the sidebar badge.

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const row = await prisma.intake.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!row) return jsonError("Intake not found", 404);
    const updated = await prisma.intake.update({
      where: { id },
      data: { adminViewedAt: new Date() },
      select: { adminViewedAt: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin API] Error marking intake viewed:", error);
    return jsonError("Failed to update intake", 500);
  }
}
