import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  type IntakeAnswers,
  isIntakeStepId,
  isReadOnlyStatus,
  parseAnswers,
  parseContact,
  parseIntakeKind,
} from "@/lib/intake/catalog";
import {
  intakeWriteLimiter,
  invalidBody,
  jsonError,
  readJsonBody,
  tooManyRequests,
} from "@/lib/intake/http";
import { jsonEqual } from "@/lib/intake/answers";
import { saveIntakeAnswers } from "@/lib/intake/service";
import { isIntakeTokenShape } from "@/lib/intake/tokens";

// ---------------------------------------------------------------------------
// PATCH /api/intakes/[token] — wizard autosave. Validation is lenient
// (required fields may still be empty) but formats, enums and lengths are
// enforced, and unknown answer keys are rejected. Each key is upserted as its
// own row, so two devices editing different steps never overwrite each other.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  contact: z.unknown().optional(),
  answers: z.unknown().optional(),
  lastStep: z.string().max(40).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isIntakeTokenShape(token)) return jsonError("not_found", 404);
  if (!intakeWriteLimiter.check(token)) return tooManyRequests();

  const read = await readJsonBody(request);
  if (!read.ok) return read.response;
  const parsed = bodySchema.safeParse(read.body);
  if (!parsed.success) {
    return invalidBody([{ field: "body", message: "invalid" }]);
  }

  try {
    const intake = await prisma.intake.findUnique({
      where: { token },
      select: { id: true, status: true, productKind: true },
    });
    if (!intake) return jsonError("not_found", 404);
    if (isReadOnlyStatus(intake.status)) return jsonError("read_only", 409);

    const kind = parseIntakeKind(intake.productKind) ?? "convite";
    const data: Prisma.IntakeUpdateInput = {};

    if (parsed.data.lastStep !== undefined) {
      if (!isIntakeStepId(kind, parsed.data.lastStep)) {
        return invalidBody([{ field: "lastStep", message: "invalid" }]);
      }
      data.lastStep = parsed.data.lastStep;
    }

    if (parsed.data.contact !== undefined) {
      const contact = parseContact(parsed.data.contact, "lenient");
      if (!contact.ok) return invalidBody(contact.issues);
      // Autosave can fire mid-typing; an emptied field never blanks the column.
      if (contact.contact.name) data.contactName = contact.contact.name;
      if (contact.contact.whatsapp) {
        data.contactWhatsapp = contact.contact.whatsapp;
      }
    }

    let answers: IntakeAnswers = {};
    if (parsed.data.answers !== undefined) {
      const result = parseAnswers(parsed.data.answers, "lenient");
      if (!result.ok) return invalidBody(result.issues);
      answers = result.answers;
    }

    // Rewriting an unchanged value would bump its updatedAt and light up the
    // admin's "Alterado" markers, so only changed keys are written.
    const keys = Object.keys(answers);
    if (keys.length) {
      const stored = await prisma.intakeAnswer.findMany({
        where: { intakeId: intake.id, key: { in: keys } },
        select: { key: true, value: true },
      });
      const storedByKey = new Map(stored.map((row) => [row.key, row.value]));
      answers = Object.fromEntries(
        Object.entries(answers).filter(
          ([key, value]) =>
            !storedByKey.has(key) || !jsonEqual(storedByKey.get(key), value),
        ),
      ) as IntakeAnswers;
    }

    const changedContent =
      Object.keys(answers).length > 0 ||
      data.contactName !== undefined ||
      data.contactWhatsapp !== undefined;
    if (changedContent) data.answersUpdatedAt = new Date();

    const results = await saveIntakeAnswers(intake.id, answers, data);
    const updated = results.at(-1) as { answersUpdatedAt: Date | null };

    return NextResponse.json({
      ok: true,
      answersUpdatedAt: updated?.answersUpdatedAt ?? null,
    });
  } catch (error) {
    console.error("[Intake API] Error saving answers:", error);
    return jsonError("server_error", 500);
  }
}
