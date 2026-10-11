import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { isIntakeUnseen } from "@/lib/intake/answers";
import { intakeRef } from "@/lib/intake/links";

import {
  firstParam,
  parsePage,
  parseSearch,
  type Pagination,
  type RawSearchParams,
} from "./params";
import { escapeLike, fetchPage } from "./query";

export const INTAKE_PAGE_SIZE = 25;
export const INTAKE_TABS = [
  "new",
  "submitted",
  "draft",
  "in_production",
  "archived",
] as const;
export type IntakeTab = (typeof INTAKE_TABS)[number];

export interface IntakeListParams {
  /** Null when the URL names no tab: the loader then picks the default. */
  tab: IntakeTab | null;
  q: string;
  page: number;
}

export type IntakeListRow = {
  id: string;
  reference: string;
  productKind: string;
  demoName: string;
  source: string;
  status: string;
  contactName: string | null;
  lastActivity: string;
  unseen: boolean;
};

export interface IntakeListResult {
  rows: IntakeListRow[];
  pagination: Pagination;
  params: { tab: IntakeTab; q: string; page: number };
  tabCounts: Record<IntakeTab, number>;
}

const intakeListSelect = {
  id: true,
  productKind: true,
  demoName: true,
  source: true,
  status: true,
  contactName: true,
  createdAt: true,
  answersUpdatedAt: true,
  adminViewedAt: true,
} satisfies Prisma.IntakeSelect;

export function parseIntakeListParams(raw: RawSearchParams): IntakeListParams {
  const tab = firstParam(raw, "tab");
  return {
    tab: INTAKE_TABS.includes(tab as IntakeTab) ? (tab as IntakeTab) : null,
    q: parseSearch(firstParam(raw, "q")),
    page: parsePage(firstParam(raw, "page")),
  };
}

/**
 * Submitted and either never opened by the admin or edited since. The database
 * form of `isIntakeUnseen` in lib/intake/answers.ts: keep the two in step.
 */
export function unseenIntakeWhere(): Prisma.IntakeWhereInput {
  return {
    status: "submitted",
    OR: [
      { adminViewedAt: null },
      { answersUpdatedAt: { gt: prisma.intake.fields.adminViewedAt } },
    ],
  };
}

export function buildIntakeListWhere(params: {
  tab: IntakeTab;
  q: string;
}): Prisma.IntakeWhereInput {
  // Search looks across every tab, as it always has.
  if (params.q) {
    const term = escapeLike(params.q);
    return {
      OR: [
        { contactName: { contains: term, mode: "insensitive" } },
        { demoName: { contains: term, mode: "insensitive" } },
        // The reference shown to the admin is the last six characters of the id.
        { id: { endsWith: term, mode: "insensitive" } },
      ],
    };
  }
  return params.tab === "new" ? unseenIntakeWhere() : { status: params.tab };
}

export async function loadIntakeListPage(
  requested: IntakeListParams,
): Promise<IntakeListResult> {
  const [byStatus, unseen] = await Promise.all([
    prisma.intake.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.intake.count({ where: unseenIntakeWhere() }),
  ]);

  const tabCounts: Record<IntakeTab, number> = {
    new: unseen,
    submitted: 0,
    draft: 0,
    in_production: 0,
    archived: 0,
  };
  for (const group of byStatus) {
    const status = group.status as IntakeTab;
    if (status !== "new" && INTAKE_TABS.includes(status)) {
      tabCounts[status] = group._count._all;
    }
  }

  const tab = requested.tab ?? (unseen > 0 ? "new" : "submitted");
  const where = buildIntakeListWhere({ tab, q: requested.q });

  const { rows, pagination } = await fetchPage(
    requested.page,
    INTAKE_PAGE_SIZE,
    () => prisma.intake.count({ where }),
    (skip, take) =>
      prisma.intake.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: intakeListSelect,
        skip,
        take,
      }),
  );

  return {
    rows: rows.map((intake) => ({
      id: intake.id,
      reference: intakeRef(intake.id),
      productKind: intake.productKind,
      demoName: intake.demoName,
      source: intake.source,
      status: intake.status,
      contactName: intake.contactName,
      lastActivity: (intake.answersUpdatedAt ?? intake.createdAt).toISOString(),
      unseen: isIntakeUnseen(intake),
    })),
    pagination,
    params: { tab, q: requested.q, page: pagination.page },
    tabCounts,
  };
}
