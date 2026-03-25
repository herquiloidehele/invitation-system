import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
        ...(themeId !== undefined && { themeId }),
        ...(body.couple !== undefined && { couple: body.couple }),
        ...(body.date !== undefined && { date: body.date }),
        ...(body.quote !== undefined && { quote: body.quote }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.rsvp !== undefined && { rsvp: body.rsvp }),
        ...(body.schedule !== undefined && { schedule: body.schedule }),
        ...(body.dressCode !== undefined && { dressCode: body.dressCode }),
        ...(body.giftRegistry !== undefined && {
          giftRegistry: body.giftRegistry,
        }),
        ...(body.audio !== undefined && { audio: body.audio }),
        ...(body.heroImage !== undefined && { heroImage: body.heroImage }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.faqs !== undefined && { faqs: body.faqs }),
        ...(body.guestGuide !== undefined && { guestGuide: body.guestGuide }),
        ...(body.envelope !== undefined && { envelope: body.envelope }),
        ...(body.saveDateStyle !== undefined && {
          saveDateStyle: body.saveDateStyle,
        }),
        ...(body.cinematicImageUrl !== undefined && {
          cinematicImageUrl: body.cinematicImageUrl,
        }),
        ...(body.sectionImages !== undefined && {
          sectionImages: body.sectionImages,
        }),
        ...(body.parents !== undefined && {
          parents: body.parents,
        }),
        ...(body.invitationType !== undefined && {
          invitationType: body.invitationType,
        }),
        ...(body.externalLink !== undefined && {
          externalLink: body.externalLink,
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
