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
  phoneNumber: z.string(),
  tableLabel: z.string().optional(),
  totalGuests: z.coerce.number().int().min(0).nullable().optional(),
  canInviteOthers: z.boolean().optional(),
  note: z.string().optional(),
  customExternalLink: z.string().optional(),
});

async function resolveInvitation(id: string) {
  return prisma.invitation.findUnique({
    where: { id },
    select: { slug: true, guestManagementEnabled: true },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const inv = await resolveInvitation(id);
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const inv = await resolveInvitation(id);
  if (!inv) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
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
    // Note: admin can create guests even when feature is disabled (so they can
    // prepare the list before the host turns the feature on).
    const guest = await createGuest(inv.slug, parsed.data);
    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Admin Guests API] Error creating guest:", error);
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 },
    );
  }
}
