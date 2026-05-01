import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeJsonField } from "@/lib/json-sanitize";
import { normalizeInvitationEventType } from "@/lib/invitation-event-types";

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
        theme: { select: { id: true, name: true, label: true } },
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

    // Resolve themeId — accept either themeId (new) or template slug (legacy)
    let themeId: string | undefined = body.themeId;
    if (!themeId && body.template) {
      const theme = await prisma.theme.findUnique({
        where: { name: body.template },
      });
      if (theme) themeId = theme.id;
    }

    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(themeId !== undefined && { theme: { connect: { id: themeId } } }),
        ...(body.couple !== undefined && {
          couple: sanitizeJsonField(body.couple, existing.couple),
        }),
        ...(body.date !== undefined && {
          date: sanitizeJsonField(body.date, existing.date),
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
        ...(body.envelope !== undefined && {
          envelope: sanitizeJsonField(body.envelope, null),
        }),
        ...(body.saveDateStyle !== undefined && {
          saveDateStyle: body.saveDateStyle,
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
        ...(body.textStyles !== undefined && {
          textStyles: sanitizeJsonField(body.textStyles, null),
        }),
        ...(body.cardStyles !== undefined && {
          cardStyles: sanitizeJsonField(body.cardStyles, null),
        }),
        ...(body.imageSettings !== undefined && {
          imageSettings: sanitizeJsonField(body.imageSettings, null),
        }),
        ...(body.customTexts !== undefined && {
          customTexts: sanitizeJsonField(body.customTexts, null),
        }),
        ...(body.eventType !== undefined && {
          eventType: normalizeInvitationEventType(body.eventType),
        }),
        ...(body.guestManagementEnabled !== undefined && {
          guestManagementEnabled: body.guestManagementEnabled === true,
        }),
        ...(body.guestMessageTemplate !== undefined && {
          guestMessageTemplate: body.guestMessageTemplate || null,
        }),
      },
      include: {
        theme: { select: { id: true, name: true, label: true } },
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
