import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  getInvitationEditPath,
  getSaveTheDateEditPath,
} from "@/lib/admin-row-navigation";
import {
  buildInvitationFromIntake,
  buildSaveTheDateFromIntake,
  intakeSlugBase,
  nextFreeSlug,
} from "@/lib/intake/apply";
import { isReadOnlyStatus } from "@/lib/intake/catalog";
import { jsonError } from "@/lib/intake/http";
import { type LoadedIntake, loadIntakeById } from "@/lib/intake/service";
import { buildInvitationCreateData } from "@/lib/invitation-create-data";
import {
  buildDuplicateInvitationInitialData,
  createCustomerThemeCopy,
  customerInvitationResetData,
} from "@/lib/invitation-duplication";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";

// ---------------------------------------------------------------------------
// POST /api/admin/intakes/[id]/apply — turn the customer's answers into their
// own invitation or Save the Date. Starts from a copy of the chosen demo (the
// same reset rules as "Duplicar convite"), overlays the answers, and moves the
// intake to "em produção" in the same transaction. Auth: proxy.ts.
// ---------------------------------------------------------------------------

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function applyInvitation(intake: LoadedIntake) {
  const demoId = intake.row.invitationId;
  const row = demoId
    ? await prisma.invitation.findUnique({
        where: { id: demoId },
        include: { theme: true },
      })
    : null;
  if (!row) {
    return jsonError("demo_missing", 409, {
      message: "O modelo escolhido já não existe. Duplique outro modelo manualmente.",
    });
  }
  if (row.renderMode === "ai") {
    return jsonError("ai_demo_unsupported", 409, {
      message: "Modelos IA não podem ser preenchidos automaticamente.",
    });
  }

  const base = intakeSlugBase(intake.answers);
  const taken = await prisma.invitation.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const slug = nextFreeSlug(base, new Set(taken.map((item) => item.slug)));
  const body = buildInvitationFromIntake(
    buildDuplicateInvitationInitialData(row),
    intake.answers,
    { slug },
  );
  const displayName =
    buildInvitationDisplayName({
      eventType: body.eventType,
      primaryName: body.couple.bride,
      secondaryName: body.couple.groom,
    }) || slug;

  const created = await prisma.$transaction(async (tx) => {
    const theme = await createCustomerThemeCopy(tx, row.theme, slug, displayName);
    const data = buildInvitationCreateData(body, theme.id);
    Object.assign(data, customerInvitationResetData());
    const invitation = await tx.invitation.create({
      data,
      select: { id: true },
    });
    await tx.intake.update({
      where: { id: intake.row.id },
      data: { status: "in_production", createdInvitationId: invitation.id },
    });
    return invitation;
  });

  return NextResponse.json(
    {
      kind: "convite",
      id: created.id,
      editPath: getInvitationEditPath(created.id),
    },
    { status: 201 },
  );
}

async function applySaveTheDate(intake: LoadedIntake) {
  const demoId = intake.row.saveTheDateId;
  const demo = demoId
    ? await prisma.saveTheDate.findUnique({
        where: { id: demoId },
        select: {
          themeId: true,
          envelope: true,
          textStyles: true,
          rsvp: true,
          audio: true,
          bottomHero: true,
          customMessage: true,
        },
      })
    : null;
  if (!demo) {
    return jsonError("demo_missing", 409, {
      message: "O modelo escolhido já não existe. Crie o Save the Date manualmente.",
    });
  }

  const base = intakeSlugBase(intake.answers);
  const taken = await prisma.saveTheDate.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const slug = nextFreeSlug(base, new Set(taken.map((item) => item.slug)));
  const data = buildSaveTheDateFromIntake(demo, intake.answers, { slug });

  const created = await prisma.$transaction(async (tx) => {
    const saveTheDate = await tx.saveTheDate.create({
      data,
      select: { id: true },
    });
    await tx.intake.update({
      where: { id: intake.row.id },
      data: { status: "in_production", createdSaveTheDateId: saveTheDate.id },
    });
    return saveTheDate;
  });

  return NextResponse.json(
    {
      kind: "save-the-date",
      id: created.id,
      editPath: getSaveTheDateEditPath(created.id),
    },
    { status: 201 },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const intake = await loadIntakeById(id);
    if (!intake) return jsonError("Intake not found", 404);
    if (isReadOnlyStatus(intake.row.status)) {
      return jsonError("already_applied", 409, {
        message: "Este formulário já está em produção ou arquivado.",
      });
    }

    return intake.kind === "save-the-date"
      ? await applySaveTheDate(intake)
      : await applyInvitation(intake);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return jsonError("slug_conflict", 409, {
        message: "O endereço gerado já existe. Tente novamente.",
      });
    }
    console.error("[Admin API] Error applying intake:", error);
    return jsonError("Failed to apply intake", 500);
  }
}
