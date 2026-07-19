import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildInvitationCreateData,
  type InvitationCreateBody,
} from "@/lib/invitation-create-data";
import { validateInvitationLanguageSettings } from "@/lib/invitation-translations";

// ---------------------------------------------------------------------------
// POST /api/admin/invitations — Create a new invitation
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InvitationCreateBody;

    // Basic validation — accept either themeId (new) or template slug (legacy)
    if (!body.slug || !body.couple || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, couple, date" },
        { status: 400 },
      );
    }

    const languageError = validateInvitationLanguageSettings(body);
    if (languageError) {
      return NextResponse.json({ error: languageError }, { status: 400 });
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
      data: buildInvitationCreateData(body, themeId),
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
