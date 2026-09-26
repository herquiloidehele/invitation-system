import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { isReadOnlyStatus, validateAll } from "@/lib/intake/catalog";
import {
  intakeSubmitLimiter,
  jsonError,
  tooManyRequests,
} from "@/lib/intake/http";
import { loadIntakeByToken } from "@/lib/intake/service";
import { isIntakeTokenShape } from "@/lib/intake/tokens";

// ---------------------------------------------------------------------------
// POST /api/intakes/[token]/submit — strict validation of every step. On
// failure the wizard jumps to the first invalid step. Re-submitting after an
// edit keeps the first submission date; answersUpdatedAt tells the admin
// something changed.
// ---------------------------------------------------------------------------

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isIntakeTokenShape(token)) return jsonError("not_found", 404);
  if (!intakeSubmitLimiter.check(token)) return tooManyRequests();

  try {
    const intake = await loadIntakeByToken(token);
    if (!intake) return jsonError("not_found", 404);
    if (isReadOnlyStatus(intake.row.status)) return jsonError("read_only", 409);

    const validation = validateAll(
      intake.kind,
      {
        name: intake.row.contactName ?? "",
        whatsapp: intake.row.contactWhatsapp ?? "",
      },
      intake.answers,
      { customizable: intake.customizable },
    );
    if (!validation.ok) {
      return jsonError("invalid_answers", 422, {
        step: validation.step,
        issues: validation.issues,
      });
    }

    const now = new Date();
    const updated = await prisma.intake.update({
      where: { id: intake.row.id },
      data: {
        status: "submitted",
        submittedAt: intake.row.submittedAt ?? now,
        answersUpdatedAt: now,
      },
      select: { submittedAt: true },
    });

    return NextResponse.json({ ok: true, submittedAt: updated.submittedAt });
  } catch (error) {
    console.error("[Intake API] Error submitting intake:", error);
    return jsonError("server_error", 500);
  }
}
