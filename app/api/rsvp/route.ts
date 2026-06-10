import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  normalizeRsvpCustomFields,
  validateRsvpCustomAnswers,
} from "@/lib/rsvp-custom-fields";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const rsvpSchema = z.object({
  invitationSlug: z.string().min(1, "Slug do convite é obrigatório"),
  guestName: z.string().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido").optional(),
  attending: z.boolean({ error: "Confirmação de presença é obrigatória" }),
  dietaryRestrictions: z.string().optional(),
  message: z.string().optional(),
  customAnswers: z
    .array(z.object({ fieldId: z.string(), value: z.unknown() }))
    .optional(),
  /** Optional guest token from `?g=<token>` link — links the RSVP to a Guest. */
  guestToken: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/rsvp
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = rsvpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const data = result.data;

    // Verify that the invitation exists
    const invitation = await prisma.invitation.findUnique({
      where: { slug: data.invitationSlug },
      select: { slug: true, rsvp: true },
    });

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Convite não encontrado",
        },
        { status: 404 },
      );
    }

    // If a guestToken is provided, validate it belongs to this invitation
    let guestId: string | null = null;
    if (data.guestToken) {
      const guest = await prisma.guest.findUnique({
        where: { token: data.guestToken },
        select: { id: true, invitationSlug: true },
      });
      if (!guest || guest.invitationSlug !== invitation.slug) {
        return NextResponse.json(
          {
            success: false,
            message: "Convidado não pertence a este convite",
          },
          { status: 400 },
        );
      }
      guestId = guest.id;
    }

    const customFields = normalizeRsvpCustomFields(invitation.rsvp);
    const customValidation = validateRsvpCustomAnswers({
      fields: customFields,
      submittedAnswers: data.customAnswers ?? [],
      attending: data.attending,
    });

    if (!customValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos",
          errors: customValidation.errors,
        },
        { status: 400 },
      );
    }

    const customAnswersJson =
      customValidation.answers.length > 0
        ? (customValidation.answers as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    // Persist to database
    await prisma.rsvpResponse.create({
      data: {
        invitationSlug: data.invitationSlug,
        guestName: data.guestName,
        email: data.email ?? null,
        attending: data.attending,
        dietaryRestrictions: data.dietaryRestrictions ?? null,
        message: data.message ?? null,
        customAnswers: customAnswersJson,
        guestId,
      },
    });

    console.log(
      "[RSVP] Saved:",
      data.guestName,
      "for",
      data.invitationSlug,
      guestId ? `(guestId=${guestId})` : "",
    );

    return NextResponse.json({
      success: true,
      message: "RSVP confirmado!",
    });
  } catch (error) {
    console.error("[RSVP] Error processing request:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
