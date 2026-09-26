import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  invitationBlockSelect,
  isInvitationBlocked,
} from "@/lib/invitation-block";
import { isPreDesigned } from "@/lib/landing-customization";
import { foldAnswerRows } from "./answers";
import {
  INTAKE_EVENT_TYPES,
  type IntakeAnswers,
  type IntakeEventType,
  type IntakeKind,
} from "./catalog";

// ---------------------------------------------------------------------------
// Server-side intake data access shared by the public pages, the public API
// and the admin API. Route handlers keep their own validation; this module
// only knows how to read and write rows.
// ---------------------------------------------------------------------------

export interface IntakeDemoSummary {
  kind: IntakeKind;
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  customizable: boolean;
  isDemo: boolean;
  blocked: boolean;
  /** Preselected on the event step. */
  eventType: IntakeEventType;
}

function toIntakeEventType(value: unknown): IntakeEventType {
  return (INTAKE_EVENT_TYPES as readonly unknown[]).includes(value)
    ? (value as IntakeEventType)
    : "wedding";
}

type CoupleLike = { bride?: unknown; groom?: unknown } | null;

function coupleName(couple: unknown): string {
  const value = couple as CoupleLike;
  return [value?.bride, value?.groom]
    .filter((part): part is string => typeof part === "string" && !!part.trim())
    .join(" & ");
}

const invitationDemoSelect = {
  id: true,
  slug: true,
  isDemo: true,
  couple: true,
  heroImage: true,
  landingModelName: true,
  landingImageUrl: true,
  landingCustomizationLevel: true,
  eventType: true,
  ...invitationBlockSelect,
} as const;

const saveTheDateDemoSelect = {
  id: true,
  slug: true,
  isDemo: true,
  couple: true,
  landingModelName: true,
  landingImageUrl: true,
  landingCustomizationLevel: true,
} as const;

type InvitationDemoRow = Prisma.InvitationGetPayload<{
  select: typeof invitationDemoSelect;
}>;
type SaveTheDateDemoRow = Prisma.SaveTheDateGetPayload<{
  select: typeof saveTheDateDemoSelect;
}>;

function invitationSummary(row: InvitationDemoRow): IntakeDemoSummary {
  return {
    kind: "convite",
    id: row.id,
    slug: row.slug,
    name: row.landingModelName?.trim() || coupleName(row.couple) || row.slug,
    imageUrl: row.landingImageUrl || row.heroImage || null,
    customizable: !isPreDesigned(row.landingCustomizationLevel),
    isDemo: row.isDemo,
    blocked: isInvitationBlocked(row),
    eventType: toIntakeEventType(row.eventType),
  };
}

function saveTheDateSummary(row: SaveTheDateDemoRow): IntakeDemoSummary {
  return {
    kind: "save-the-date",
    id: row.id,
    slug: row.slug,
    name: row.landingModelName?.trim() || coupleName(row.couple) || row.slug,
    imageUrl: row.landingImageUrl || null,
    customizable: !isPreDesigned(row.landingCustomizationLevel),
    isDemo: row.isDemo,
    blocked: false,
    eventType: "wedding",
  };
}

export async function findDemo(
  kind: IntakeKind,
  where: { slug: string } | { id: string },
): Promise<IntakeDemoSummary | null> {
  if (kind === "convite") {
    const row = await prisma.invitation.findUnique({
      where,
      select: invitationDemoSelect,
    });
    return row ? invitationSummary(row) : null;
  }
  const row = await prisma.saveTheDate.findUnique({
    where,
    select: saveTheDateDemoSelect,
  });
  return row ? saveTheDateSummary(row) : null;
}

/** Demo models an admin can attach an intake to, newest first. */
export async function listDemos(): Promise<IntakeDemoSummary[]> {
  const [invitations, saveTheDates] = await Promise.all([
    prisma.invitation.findMany({
      where: { isDemo: true },
      orderBy: { createdAt: "desc" },
      select: invitationDemoSelect,
    }),
    prisma.saveTheDate.findMany({
      where: { isDemo: true },
      orderBy: { createdAt: "desc" },
      select: saveTheDateDemoSelect,
    }),
  ]);
  return [
    ...invitations.map(invitationSummary),
    ...saveTheDates.map(saveTheDateSummary),
  ];
}

const intakeWithDemoInclude = {
  answers: { select: { key: true, value: true, updatedAt: true } },
  invitation: { select: invitationDemoSelect },
  saveTheDate: { select: saveTheDateDemoSelect },
} satisfies Prisma.IntakeInclude;

export type IntakeWithDemoRow = Prisma.IntakeGetPayload<{
  include: typeof intakeWithDemoInclude;
}>;

export interface LoadedIntake {
  row: IntakeWithDemoRow;
  kind: IntakeKind;
  answers: IntakeAnswers;
  /** Null when the demo was deleted after the intake was created. */
  demo: IntakeDemoSummary | null;
  /** Colors and FAQs are asked only for fully customizable demos. */
  customizable: boolean;
}

function toLoadedIntake(row: IntakeWithDemoRow): LoadedIntake {
  const kind: IntakeKind =
    row.productKind === "save-the-date" ? "save-the-date" : "convite";
  const demo = row.invitation
    ? invitationSummary(row.invitation)
    : row.saveTheDate
      ? saveTheDateSummary(row.saveTheDate)
      : null;
  return {
    row,
    kind,
    answers: foldAnswerRows(row.answers),
    demo,
    customizable: demo?.customizable ?? true,
  };
}

export async function loadIntakeByToken(
  token: string,
): Promise<LoadedIntake | null> {
  const row = await prisma.intake.findUnique({
    where: { token },
    include: intakeWithDemoInclude,
  });
  return row ? toLoadedIntake(row) : null;
}

export async function loadIntakeById(id: string): Promise<LoadedIntake | null> {
  const row = await prisma.intake.findUnique({
    where: { id },
    include: intakeWithDemoInclude,
  });
  return row ? toLoadedIntake(row) : null;
}

/** Sidebar badge: submitted intakes never opened, or edited since opened. */
export async function countUnseenIntakes(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Intake"
    WHERE "status" = 'submitted'
      AND ("adminViewedAt" IS NULL OR "answersUpdatedAt" > "adminViewedAt")
  `;
  return Number(rows[0]?.count ?? 0);
}

/** Per-key upserts plus the intake's bookkeeping, in one transaction. */
export function saveIntakeAnswers(
  intakeId: string,
  answers: IntakeAnswers,
  intakeData: Prisma.IntakeUpdateInput,
) {
  const writes = Object.entries(answers).map(([key, value]) =>
    prisma.intakeAnswer.upsert({
      where: { intakeId_key: { intakeId, key } },
      create: { intakeId, key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    }),
  );
  return prisma.$transaction([
    ...writes,
    prisma.intake.update({
      where: { id: intakeId },
      data: intakeData,
      select: { answersUpdatedAt: true },
    }),
  ]);
}
