import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// PUT /api/admin/invitations/[id]/block — block or unblock an invitation
//
// Block state lives outside the invitation form on purpose: the generic PUT
// never touches these columns, so saving the editor cannot unblock anything.
// Auth is enforced by the middleware matcher for /api/admin/*.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  blocked: z.boolean(),
  reason: z.string().max(500).nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid body",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const existing = await prisma.invitation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }

  const { blocked } = parsed.data;
  // The reason only matters while blocking; blank reasons are stored as null.
  const reason = blocked ? (parsed.data.reason?.trim() || null) : null;

  try {
    const updated = await prisma.invitation.update({
      where: { id },
      data: blocked
        ? { blockedAt: new Date(), blockedReason: reason }
        : { blockedAt: null, blockedReason: null },
      select: { id: true, blockedAt: true, blockedReason: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin Block Invitation] Error:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 },
    );
  }
}
