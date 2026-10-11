import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { GuestbookConfig, RsvpCustomAnswer } from "@/lib/types";

import {
  firstParam,
  paginate,
  parseOption,
  parsePage,
  stripControlChars,
  type Pagination,
  type RawSearchParams,
} from "./params";
import { coupleSearchWhere, fetchPage } from "./query";

export const RSVP_PAGE_SIZE = 50;
export const RSVP_TARGET_LIMIT = 20;
export const RSVP_TABS = ["invitations", "std"] as const;
export type RsvpTab = (typeof RSVP_TABS)[number];
export type RsvpTargetKind = "invitation" | "std";

export interface RsvpListParams {
  tab: RsvpTab;
  /** Invitation slug from the URL, or null to use the newest invitation. */
  invitation: string | null;
  /** Save-the-date slug from the URL, or null to use the newest with RSVP on. */
  std: string | null;
  page: number;
}

/** One entry of the picker: who the responses belong to. */
export interface RsvpTargetOption {
  slug: string;
  bride: string;
  groom: string;
  count: number;
}

export interface InvitationRsvpTarget extends RsvpTargetOption {
  id: string;
  /** Guestbook settings — drives the per-message publish control. */
  guestbook: GuestbookConfig | null;
}

export interface RsvpResponseRow {
  id: string;
  guestName: string;
  email: string | null;
  attending: boolean;
  dietaryRestrictions: string | null;
  message: string | null;
  customAnswers: RsvpCustomAnswer[] | null;
  submittedAt: Date | string;
}

export interface RsvpPageResult {
  params: { tab: RsvpTab; page: number };
  /** Selected invitation; null on the std tab or when there are no invitations. */
  invitation: InvitationRsvpTarget | null;
  /** Selected save-the-date; null when none has RSVP enabled. */
  std: RsvpTargetOption | null;
  /** Responses of the active tab's selection, one page. */
  responses: RsvpResponseRow[];
  pagination: Pagination;
  stats: { total: number; attending: number; declined: number };
  /** Badge on the Save the Date tab, whichever tab is active. */
  stdResponseCount: number;
}

/** Save-the-dates only take RSVPs when `rsvp.enabled` is true. */
const rsvpEnabledWhere = {
  rsvp: { path: ["enabled"], equals: true },
} satisfies Prisma.SaveTheDateWhereInput;

const newestFirst = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

const optionSelect = {
  slug: true,
  couple: true,
  _count: { select: { rsvpResponses: true } },
};

const invitationTargetSelect = {
  ...optionSelect,
  id: true,
  guestbook: true,
} satisfies Prisma.InvitationSelect;

const responseSelect = {
  id: true,
  guestName: true,
  email: true,
  attending: true,
  dietaryRestrictions: true,
  message: true,
  customAnswers: true,
  submittedAt: true,
};

function toOption(row: {
  slug: string;
  couple: unknown;
  _count: { rsvpResponses: number };
}): RsvpTargetOption {
  const couple = (row.couple ?? {}) as { bride?: unknown; groom?: unknown };
  return {
    slug: row.slug,
    bride: typeof couple.bride === "string" ? couple.bride : "",
    groom: typeof couple.groom === "string" ? couple.groom : "",
    count: row._count.rsvpResponses,
  };
}

/** A slug from the URL, or null when it is missing or blank. */
function parseSlug(value: string | undefined): string | null {
  return stripControlChars(value ?? "").trim() || null;
}

export function parseRsvpListParams(raw: RawSearchParams): RsvpListParams {
  return {
    tab: parseOption(firstParam(raw, "tab"), RSVP_TABS, "invitations"),
    invitation: parseSlug(firstParam(raw, "invitation")),
    std: parseSlug(firstParam(raw, "std")),
    page: parsePage(firstParam(raw, "page")),
  };
}

async function resolveInvitationTarget(
  slug: string | null,
): Promise<InvitationRsvpTarget | null> {
  const row =
    (slug
      ? await prisma.invitation.findUnique({
          where: { slug },
          select: invitationTargetSelect,
        })
      : null) ??
    (await prisma.invitation.findFirst({
      orderBy: newestFirst,
      select: invitationTargetSelect,
    }));
  if (!row) return null;
  return {
    ...toOption(row),
    id: row.id,
    guestbook: (row.guestbook as GuestbookConfig | null) ?? null,
  };
}

async function resolveStdTarget(
  slug: string | null,
): Promise<RsvpTargetOption | null> {
  const row =
    (slug
      ? await prisma.saveTheDate.findFirst({
          where: { slug, ...rsvpEnabledWhere },
          select: optionSelect,
        })
      : null) ??
    (await prisma.saveTheDate.findFirst({
      where: rsvpEnabledWhere,
      orderBy: newestFirst,
      select: optionSelect,
    }));
  return row ? toOption(row) : null;
}

export async function loadRsvpPage(
  requested: RsvpListParams,
): Promise<RsvpPageResult> {
  // The save-the-date is always resolved: its count is the std tab's badge.
  const [std, invitation] = await Promise.all([
    resolveStdTarget(requested.std),
    requested.tab === "invitations"
      ? resolveInvitationTarget(requested.invitation)
      : null,
  ]);

  const submittedFirst = [
    { submittedAt: "desc" as const },
    { id: "desc" as const },
  ];

  let page: { rows: RsvpResponseRow[]; pagination: Pagination } = {
    rows: [],
    pagination: paginate(0, 1, RSVP_PAGE_SIZE),
  };
  let attending = 0;

  if (requested.tab === "invitations" && invitation) {
    const where = { invitationSlug: invitation.slug };
    [page, attending] = await Promise.all([
      fetchPage(
        requested.page,
        RSVP_PAGE_SIZE,
        () => prisma.rsvpResponse.count({ where }),
        (skip, take) =>
          prisma.rsvpResponse.findMany({
            where,
            orderBy: submittedFirst,
            select: responseSelect,
            skip,
            take,
          }) as Promise<RsvpResponseRow[]>,
      ),
      prisma.rsvpResponse.count({ where: { ...where, attending: true } }),
    ]);
  } else if (requested.tab === "std" && std) {
    const where = { saveTheDateSlug: std.slug };
    [page, attending] = await Promise.all([
      fetchPage(
        requested.page,
        RSVP_PAGE_SIZE,
        () => prisma.saveTheDateRsvpResponse.count({ where }),
        (skip, take) =>
          prisma.saveTheDateRsvpResponse.findMany({
            where,
            orderBy: submittedFirst,
            select: responseSelect,
            skip,
            take,
          }) as Promise<RsvpResponseRow[]>,
      ),
      prisma.saveTheDateRsvpResponse.count({
        where: { ...where, attending: true },
      }),
    ]);
  }

  const total = page.pagination.total;
  return {
    params: { tab: requested.tab, page: page.pagination.page },
    invitation,
    std,
    responses: page.rows,
    pagination: page.pagination,
    stats: {
      total,
      attending: Math.min(attending, total),
      declined: Math.max(total - attending, 0),
    },
    stdResponseCount: std?.count ?? 0,
  };
}

/** Picker options: newest first, at most RSVP_TARGET_LIMIT. */
export async function searchRsvpTargets(
  kind: RsvpTargetKind,
  q: string,
): Promise<RsvpTargetOption[]> {
  const rows =
    kind === "invitation"
      ? await prisma.invitation.findMany({
          where: coupleSearchWhere(q),
          orderBy: newestFirst,
          take: RSVP_TARGET_LIMIT,
          select: optionSelect,
        })
      : await prisma.saveTheDate.findMany({
          where: { ...rsvpEnabledWhere, ...coupleSearchWhere(q) },
          orderBy: newestFirst,
          take: RSVP_TARGET_LIMIT,
          select: optionSelect,
        });
  return rows.map(toOption);
}
