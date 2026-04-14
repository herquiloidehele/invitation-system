import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * Reject empty strings for JSON columns — they cause `JSON.parse("")`
 * failures in the pg adapter. For non-nullable JSON columns the fallback
 * is the existing DB value; for nullable columns pass `null`.
 */
function sanitizeJsonField(
  value: unknown,
  fallback: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === "" || (typeof value === "string" && value.trim() === "")) {
    return fallback === null
      ? Prisma.JsonNull
      : (fallback as Prisma.InputJsonValue);
  }
  return value as Prisma.InputJsonValue;
}

// ---------------------------------------------------------------------------
// GET /api/admin/invitations/[id] — Get a single invitation
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        model: { select: { id: true, name: true, label: true } },
        rsvpResponses: {
          orderBy: { submittedAt: "desc" },
        },
        _count: {
          select: { rsvpResponses: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[Admin API] Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/invitations/[id] — Update an invitation
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();

    // Verify invitation exists
    const existing = await prisma.invitation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // If slug changed, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.invitation.findUnique({
        where: { slug: body.slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: `Slug "${body.slug}" already exists` },
          { status: 409 },
        );
      }
    }

    // Resolve modelId — accept either modelId (new) or template slug (legacy)
    let modelId: string | undefined = body.modelId;
    if (!modelId && body.template) {
      const model = await prisma.model.findUnique({
        where: { name: body.template },
      });
      if (model) modelId = model.id;
    }

    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(modelId !== undefined && { model: { connect: { id: modelId } } }),
        ...(body.couple !== undefined && {
          couple: sanitizeJsonField(body.couple, existing.couple),
        }),
        ...(body.date !== undefined && {
          date: sanitizeJsonField(body.date, existing.date),
        }),
        ...(body.styles !== undefined && {
          styles: body.styles,
        }),
        ...(body.quote !== undefined && { quote: body.quote }),
        ...(body.location !== undefined && {
          location: sanitizeJsonField(body.location, existing.location),
        }),
        ...(body.location2 !== undefined && {
          location2: sanitizeJsonField(body.location2, null),
        }),
        ...(body.rsvp !== undefined && {
          rsvp: sanitizeJsonField(body.rsvp, existing.rsvp),
        }),
        ...(body.schedule !== undefined && {
          schedule: sanitizeJsonField(body.schedule, existing.schedule),
        }),
        ...(body.dressCode !== undefined && {
          dressCode: sanitizeJsonField(body.dressCode, existing.dressCode),
        }),
        ...(body.giftRegistry !== undefined && {
          giftRegistry: sanitizeJsonField(
            body.giftRegistry,
            existing.giftRegistry,
          ),
        }),
        ...(body.audio !== undefined && {
          audio: sanitizeJsonField(body.audio, existing.audio),
        }),
        ...(body.heroImage !== undefined && { heroImage: body.heroImage }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.faqs !== undefined && {
          faqs: sanitizeJsonField(body.faqs, null),
        }),
        ...(body.guestGuide !== undefined && {
          guestGuide: sanitizeJsonField(body.guestGuide, null),
        }),
        ...(body.cinematicImageUrl !== undefined && {
          cinematicImageUrl: body.cinematicImageUrl,
        }),
        ...(body.sectionImages !== undefined && {
          sectionImages: sanitizeJsonField(body.sectionImages, null),
        }),
        ...(body.parents !== undefined && {
          parents: sanitizeJsonField(body.parents, null),
        }),
        ...(body.ourStory !== undefined && {
          ourStory: sanitizeJsonField(body.ourStory, null),
        }),
        ...(body.invitationType !== undefined && {
          invitationType: body.invitationType,
        }),
        ...(body.externalLink !== undefined && {
          externalLink: body.externalLink,
        }),
        ...(body.imageSettings !== undefined && {
          imageSettings: sanitizeJsonField(body.imageSettings, null),
        }),
        ...(body.customTexts !== undefined && {
          customTexts: sanitizeJsonField(body.customTexts, null),
        }),
      },
      include: {
        model: { select: { id: true, name: true, label: true } },
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[Admin API] Error updating invitation:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/invitations/[id] — Delete an invitation
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const existing = await prisma.invitation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    await prisma.invitation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin API] Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 },
    );
  }
}
