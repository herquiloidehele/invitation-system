import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/invitations — List all invitations
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        theme: { select: { id: true, name: true, label: true } },
        _count: {
          select: { rsvpResponses: true },
        },
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("[Admin API] Error listing invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/invitations — Create a new invitation
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation — accept either themeId (new) or template slug (legacy)
    if (!body.slug || !body.couple || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, couple, date" },
        { status: 400 },
      );
    }

    // Resolve themeId
    let themeId: string | undefined = body.themeId;
    if (!themeId && body.template) {
      // Legacy: look up by slug name
      const theme = await prisma.theme.findUnique({
        where: { name: body.template },
      });
      if (theme) themeId = theme.id;
    }
    if (!themeId) {
      return NextResponse.json(
        { error: "Missing required field: themeId (or template)" },
        { status: 400 },
      );
    }

    // Check for slug uniqueness
    const existing = await prisma.invitation.findUnique({
      where: { slug: body.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${body.slug}" already exists` },
        { status: 409 },
      );
    }

    const invitation = await prisma.invitation.create({
      data: {
        slug: body.slug,
        themeId,
        couple: body.couple,
        date: body.date,
        quote: body.quote ?? "",
        location: body.location ?? {},
        rsvp: body.rsvp ?? { enabled: true },
        schedule: body.schedule ?? [],
        dressCode: body.dressCode ?? "",
        giftRegistry: body.giftRegistry ?? { enabled: false, text: "" },
        audio: body.audio ?? { enabled: false, src: "", artist: "", title: "" },
        heroImage: body.heroImage ?? "",
        videoUrl: body.videoUrl ?? null,
        faqs: body.faqs ?? null,
        guestGuide: body.guestGuide ?? null,
        envelope: body.envelope ?? null,
        saveDateStyle: body.saveDateStyle ?? null,
        cinematicImageUrl: body.cinematicImageUrl ?? null,
        sectionImages: body.sectionImages ?? null,
        parents: body.parents ?? null,
      },
      include: {
        theme: { select: { id: true, name: true, label: true } },
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("[Admin API] Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
