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

export const INVITATION_PAGE_SIZE = 25;
export const INVITATION_TABS = ["real", "demo"] as const;
export type InvitationTab = (typeof INVITATION_TABS)[number];

export interface InvitationListParams {
  tab: InvitationTab;
  q: string;
  /** Theme name, or "" for every template. */
  template: string;
  page: number;
}

export type InvitationRow = {
  id: string;
  slug: string;
  /** Theme name (the slug-like identifier used by the template filter). */
  template: string;
  /** Theme label shown in the Modelo badge. */
  templateLabel: string;
  couple: { bride: string; groom: string; monogram?: string };
  eventType: "wedding" | "anniversary" | "baptism" | "engagement" | "other";
  isDemo: boolean;
  /** Set when an admin blocked the invitation (null = live). */
  blockedAt: Date | string | null;
  blockedReason: string | null;
  date: { display: string; iso?: string };
  rsvp: { enabled: boolean };
  /** "standard" | "ai" — AI invitations route to their own builder page. */
  renderMode: string;
  /** "standard" | "external_video" | "external_link" — the last two are external. */
  invitationType: string;
  /** Catalogue name shown for demos (null for customer invitations). */
  landingModelName: string | null;
  createdAt: Date | string;
  _count: { rsvpResponses: number };
};

export interface InvitationListResult {
  rows: InvitationRow[];
  pagination: Pagination;
  /** The view actually rendered: unknown template dropped, page clamped. */
  params: InvitationListParams;
  tabCounts: Record<InvitationTab, number>;
  stats: { total: number; rsvpEnabled: number; totalRsvps: number };
  themes: Array<{ name: string; label: string }>;
}

const invitationListSelect = {
  id: true,
  slug: true,
  theme: { select: { name: true, label: true } },
  couple: true,
  eventType: true,
  isDemo: true,
  blockedAt: true,
  blockedReason: true,
  date: true,
  rsvp: true,
  renderMode: true,
  invitationType: true,
  landingModelName: true,
  createdAt: true,
  _count: { select: { rsvpResponses: true } },
} satisfies Prisma.InvitationSelect;

export function parseInvitationListParams(
  raw: RawSearchParams,
): InvitationListParams {
  const template = parseSearch(firstParam(raw, "template"));
  return {
    tab: parseOption(firstParam(raw, "tab"), INVITATION_TABS, "real"),
    q: parseSearch(firstParam(raw, "q")),
    template: template === "all" ? "" : template,
    page: parsePage(firstParam(raw, "page")),
  };
}

export function buildInvitationListWhere(
  params: Pick<InvitationListParams, "tab" | "q" | "template">,
): Prisma.InvitationWhereInput {
  return {
    isDemo: params.tab === "demo",
    ...(params.template ? { theme: { name: params.template } } : {}),
    ...coupleSearchWhere(params.q),
  };
}

export async function loadInvitationListPage(
  requested: InvitationListParams,
): Promise<InvitationListResult> {
  // None of these depend on the search or the template filter.
  const [themes, real, demo, rsvpEnabled, totalRsvps] = await Promise.all([
    prisma.theme.findMany({
      select: { name: true, label: true },
      orderBy: { label: "asc" },
    }),
    prisma.invitation.count({ where: { isDemo: false } }),
    prisma.invitation.count({ where: { isDemo: true } }),
    prisma.invitation.count({
      where: { rsvp: { path: ["enabled"], equals: true } },
    }),
    prisma.rsvpResponse.count(),
  ]);

  const template = themes.some((theme) => theme.name === requested.template)
    ? requested.template
    : "";
  const where = buildInvitationListWhere({ ...requested, template });

  const { rows, pagination } = await fetchPage(
    requested.page,
    INVITATION_PAGE_SIZE,
    () => prisma.invitation.count({ where }),
    (skip, take) =>
      prisma.invitation.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: invitationListSelect,
        skip,
        take,
      }),
  );

  return {
    // Flatten theme → template / templateLabel for the client component.
    rows: rows.map(({ theme, ...row }) => ({
      ...row,
      template: theme.name,
      templateLabel: theme.label,
    })) as unknown as InvitationRow[],
    pagination,
    params: { ...requested, template, page: pagination.page },
    tabCounts: { real, demo },
    stats: { total: real + demo, rsvpEnabled, totalRsvps },
    themes,
  };
}
