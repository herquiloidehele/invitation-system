import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  GuestValidationError,
  deleteGuest,
  updateGuest,
} from "@/lib/guests";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    companion: z.string().optional(),
    phoneCountryCode: z.string().min(2).optional(),
    phoneNumber: z.string().optional(),
    tableLabel: z.string().optional(),
    totalGuests: z.coerce.number().int().min(0).nullable().optional(),
    canInviteOthers: z.boolean().optional(),
    note: z.string().optional(),
    customExternalLink: z.string().optional(),
  })
  .strict();

type ResolveResult =
  | { error: "not-found" | "forbidden" }
  | {
      invitation: { slug: string };
      guest: { id: string; invitationSlug: string };
    };

async function resolveInvitationAndGuest(
  id: string,
  guestId: string,
): Promise<ResolveResult> {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!invitation) return { error: "not-found" };

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { id: true, invitationSlug: true },
  });
  if (!guest) return { error: "not-found" };
  if (guest.invitationSlug !== invitation.slug) {
    return { error: "forbidden" };
  }
  return { invitation, guest };
}

function errorResponse(kind: "not-found" | "forbidden") {
  if (kind === "not-found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> },
) {
  const { id, guestId } = await params;
  const ctx = await resolveInvitationAndGuest(id, guestId);
  if ("error" in ctx) return errorResponse(ctx.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
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
    const updated = await updateGuest(guestId, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Admin Guests API] Error updating guest:", error);
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> },
) {
  const { id, guestId } = await params;
  const ctx = await resolveInvitationAndGuest(id, guestId);
  if ("error" in ctx) return errorResponse(ctx.error);

  try {
    await deleteGuest(guestId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Guests API] Error deleting guest:", error);
    return NextResponse.json(
      { error: "Failed to delete guest" },
      { status: 500 },
    );
  }
}
