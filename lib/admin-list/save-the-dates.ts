import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

import {
  firstParam,
  parseOption,
  parsePage,
  parseSearch,
  type Pagination,
  type RawSearchParams,
} from "./params";
import { coupleSearchWhere, fetchPage } from "./query";

export const SAVE_THE_DATE_PAGE_SIZE = 25;
export const SAVE_THE_DATE_TABS = ["real", "demo"] as const;
export type SaveTheDateTab = (typeof SAVE_THE_DATE_TABS)[number];

export interface SaveTheDateListParams {
  tab: SaveTheDateTab;
  q: string;
  page: number;
}

export type SaveTheDateRow = {
  id: string;
  slug: string;
  themeName: string;
  couple: { bride: string; groom: string };
  date: { display: string; iso?: string };
  createdAt: Date | string;
  ownerToken: string;
  rsvpEnabled: boolean;
  isDemo: boolean;
  landingModelName: string | null;
};

export interface SaveTheDateListResult {
  rows: SaveTheDateRow[];
  pagination: Pagination;
  params: SaveTheDateListParams;
  tabCounts: Record<SaveTheDateTab, number>;
}

const saveTheDateListSelect = {
  id: true,
  slug: true,
  couple: true,
  date: true,
  rsvp: true,
  isDemo: true,
  ownerToken: true,
  landingModelName: true,
  createdAt: true,
  theme: { select: { label: true } },
} satisfies Prisma.SaveTheDateSelect;

export function parseSaveTheDateListParams(
  raw: RawSearchParams,
): SaveTheDateListParams {
  return {
    tab: parseOption(firstParam(raw, "tab"), SAVE_THE_DATE_TABS, "real"),
    q: parseSearch(firstParam(raw, "q")),
    page: parsePage(firstParam(raw, "page")),
  };
}

export function buildSaveTheDateListWhere(
  params: Pick<SaveTheDateListParams, "tab" | "q">,
): Prisma.SaveTheDateWhereInput {
  return {
    isDemo: params.tab === "demo",
    ...coupleSearchWhere(params.q),
  };
}

export async function loadSaveTheDateListPage(
  requested: SaveTheDateListParams,
): Promise<SaveTheDateListResult> {
  const where = buildSaveTheDateListWhere(requested);

  const [real, demo, { rows, pagination }] = await Promise.all([
    prisma.saveTheDate.count({ where: { isDemo: false } }),
    prisma.saveTheDate.count({ where: { isDemo: true } }),
    fetchPage(
      requested.page,
      SAVE_THE_DATE_PAGE_SIZE,
      () => prisma.saveTheDate.count({ where }),
      (skip, take) =>
        prisma.saveTheDate.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: saveTheDateListSelect,
          skip,
          take,
        }),
    ),
  ]);

  return {
    rows: rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      themeName: item.theme.label,
      couple: item.couple as { bride: string; groom: string },
      date: item.date as { display: string; iso?: string },
      createdAt: item.createdAt,
      ownerToken: item.ownerToken,
      rsvpEnabled: (item.rsvp as { enabled?: boolean } | null)?.enabled === true,
      isDemo: item.isDemo,
      landingModelName: item.landingModelName,
    })),
    pagination,
    params: { ...requested, page: pagination.page },
    tabCounts: { real, demo },
  };
}
