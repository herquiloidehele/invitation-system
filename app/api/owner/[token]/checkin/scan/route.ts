import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { parseScannedValue } from "@/lib/checkin";
import { applyCheckIn, undoCheckIn } from "@/lib/checkin-service";

const schema = z.object({
  token: z.string().min(1),
  arrivedCount: z.number().int().min(0).optional(),
  undo: z.boolean().optional(),
});

async function resolveOwner(token: string) {
  return prisma.invitation.findUnique({
    where: { ownerToken: token },
    select: { slug: true, checkInEnabled: true },
  });
}

export async function POST(
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }
  const parsed = parseScannedValue(parsedBody.data.token);
  if (!parsed) {
    return NextResponse.json({ error: "Empty token" }, { status: 400 });
  }
  const pass = parsedBody.data.undo
    ? await undoCheckIn(inv.slug, parsed)
    : await applyCheckIn(inv.slug, parsed, parsedBody.data.arrivedCount);
  if (!pass) {
    return NextResponse.json({ error: "Not recognized" }, { status: 404 });
  }
  return NextResponse.json({ pass });
}
