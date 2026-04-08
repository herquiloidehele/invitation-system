import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * Reject empty strings for JSON columns — they cause `JSON.parse("")`
 * failures in the pg adapter. Returns `Prisma.JsonNull` for nullable
 * columns when the fallback is null, which satisfies Prisma's type system.
 */
function sanitizeJsonField(
  value: unknown,
  fallback: object | unknown[] | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return fallback === null
      ? Prisma.JsonNull
      : (fallback as Prisma.InputJsonValue);
  }
  return value as Prisma.InputJsonValue;
}

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
        theme: { connect: { id: themeId } },
        couple: body.couple,
        date: body.date,
        quote: body.quote ?? "",
        location: sanitizeJsonField(body.location, {}),
        location2: sanitizeJsonField(body.location2, null),
        rsvp: sanitizeJsonField(body.rsvp, { enabled: true }),
        schedule: sanitizeJsonField(body.schedule, []),
        dressCode: sanitizeJsonField(body.dressCode, {
          enabled: false,
          text: "",
        }),
        giftRegistry: sanitizeJsonField(body.giftRegistry, {
          enabled: false,
          text: "",
        }),
        audio: sanitizeJsonField(body.audio, {
          enabled: false,
          src: "",
          artist: "",
          title: "",
        }),
        heroImage: body.heroImage ?? "",
        videoUrl: body.videoUrl ?? null,
        faqs: sanitizeJsonField(body.faqs, null),
        guestGuide: sanitizeJsonField(body.guestGuide, null),
        envelope: sanitizeJsonField(body.envelope, null),
        saveDateStyle: body.saveDateStyle ?? null,
        cinematicImageUrl: body.cinematicImageUrl ?? null,
        sectionImages: sanitizeJsonField(body.sectionImages, null),
        parents: sanitizeJsonField(body.parents, null),
        ourStory: sanitizeJsonField(body.ourStory, null),
        invitationType: body.invitationType ?? "standard",
        externalLink: body.externalLink ?? null,
        textStyles: sanitizeJsonField(body.textStyles, null),
        cardStyles: sanitizeJsonField(body.cardStyles, null),
        imageSettings: sanitizeJsonField(body.imageSettings, null),
        customTexts: sanitizeJsonField(body.customTexts, null),
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
