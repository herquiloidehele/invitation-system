import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  GuestValidationError,
  createGuest,
  getGuestsForInvitation,
} from "@/lib/guests";

const upsertSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
  phoneCountryCode: z.string().min(2),
  phoneNumber: z.string().min(1),
  tableLabel: z.string().optional(),
  canInviteOthers: z.boolean().optional(),
  note: z.string().optional(),
});

async function resolveOwner(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    select: { slug: true, guestManagementEnabled: true },
  });
  return invitation;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const inv = await resolveOwner(token);
  if (!inv) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }
  const guests = await getGuestsForInvitation(inv.slug);
  return NextResponse.json({
    guests,
    invitationSlug: inv.slug,
    guestManagementEnabled: inv.guestManagementEnabled,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const inv = await resolveOwner(token);
  if (!inv) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }
  if (!inv.guestManagementEnabled) {
    return NextResponse.json(
      { error: "Guest management is disabled for this invitation" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const guest = await createGuest(inv.slug, parsed.data);
    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Owner Guests API] Error creating guest:", error);
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 },
    );
  }
}
