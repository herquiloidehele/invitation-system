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
  saveTheDateSlug: z.string().min(1, "Slug é obrigatório"),
  guestName: z.string().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido").optional(),
  attending: z.boolean({ error: "Confirmação de presença é obrigatória" }),
  dietaryRestrictions: z.string().optional(),
  companion: z.string().optional(),
  message: z.string().optional(),
  customAnswers: z
    .array(z.object({ fieldId: z.string(), value: z.unknown() }))
    .optional(),
});

// ---------------------------------------------------------------------------
// POST /api/save-the-date/rsvp
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

    // Verify that the Save the Date exists and has RSVP enabled
    const saveTheDate = await prisma.saveTheDate.findUnique({
      where: { slug: data.saveTheDateSlug },
    });

    if (!saveTheDate) {
      return NextResponse.json(
        { success: false, message: "Save the Date não encontrado" },
        { status: 404 },
      );
    }

    const rsvpConfig = saveTheDate.rsvp as { enabled: boolean } | null;
    if (!rsvpConfig?.enabled) {
      return NextResponse.json(
        { success: false, message: "Confirmação de presença não está activada" },
        { status: 403 },
      );
    }

    const customFields = normalizeRsvpCustomFields(saveTheDate.rsvp);
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
    await prisma.saveTheDateRsvpResponse.create({
      data: {
        saveTheDateSlug: data.saveTheDateSlug,
        guestName: data.guestName,
        email: data.email ?? null,
        attending: data.attending,
        dietaryRestrictions: data.dietaryRestrictions ?? null,
        companion: data.companion?.trim() || null,
        message: data.message ?? null,
        customAnswers: customAnswersJson,
      },
    });

    console.log(
      "[STD RSVP] Saved:",
      data.guestName,
      "for",
      data.saveTheDateSlug,
    );

    return NextResponse.json({ success: true, message: "Presença confirmada!" });
  } catch (error) {
    console.error("[STD RSVP] Error processing request:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
