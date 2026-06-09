import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

type CountValue = number | string | bigint;

const INTERACTION_EVENT_TYPES = [
  "maps_click",
  "waze_click",
  "gift_click",
  "audio_play",
  "calendar_click",
  "rsvp_submit",
] as const;

const COUNTED_EVENT_TYPES = [
  "envelope_open",
  ...INTERACTION_EVENT_TYPES,
] as const;

export interface InvitationAnalytics {
  slug: string;
  coupleName: string;
  template: string;
  createdAt: string;
  totalViews: number;
  uniqueVisitors: number;
  envelopeOpens: number;
  openRate: string;
  rsvpCount: number;
  conversionRate: string;
  eventBreakdown: Record<string, number>;
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  };
  viewsOverTime: { date: string; views: number; rsvps: number }[];
  recentRsvps: {
    id: string;
    guestName: string;
    attending: boolean;
    submittedAt: string;
  }[];
}

export interface AnalyticsInvitationRow {
  slug: string;
  couple: unknown;
  createdAt: Date;
  theme: { name: string };
  isDemo?: boolean;
  rsvpResponses: {
    id: string;
    guestName: string;
    attending: boolean;
    submittedAt: Date;
  }[];
}

export interface AnalyticsInvitationOption {
  slug: string;
  coupleName: string;
}

export interface PageViewSummaryRow {
  invitationSlug: string;
  totalViews: CountValue;
  uniqueVisitors: CountValue;
}

export interface EventCountRow {
  invitationSlug: string;
  type: string;
  count: CountValue;
}

export interface DeviceCountRow {
  invitationSlug: string;
  device: string | null;
  count: CountValue;
}

export interface DailyCountRow {
  invitationSlug: string;
  date: string | Date;
  count: CountValue;
}

export interface RsvpCountRow {
  invitationSlug: string;
  count: CountValue;
}

export interface ComposeInvitationAnalyticsInput {
  invitations: AnalyticsInvitationRow[];
  pageViewSummaries: PageViewSummaryRow[];
  eventCounts: EventCountRow[];
  deviceCounts: DeviceCountRow[];
  dailyViews: DailyCountRow[];
  rsvpCounts: RsvpCountRow[];
  dailyRsvps: DailyCountRow[];
}

function getRangeStart(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function toCount(value: CountValue | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asObj(val: unknown): Record<string, unknown> {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : {};
}

function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

function dateKey(date: string | Date): string {
  return date instanceof Date ? date.toISOString().slice(0, 10) : date;
}

function toIsoString(date: Date): string {
  return date.toISOString();
}

function normalizeSelectedSlug(slug: string | null | undefined): string | null {
  return slug && slug !== "all" ? slug : null;
}

function createDeviceBreakdown() {
  return { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
}

function normalizeDevice(
  device: string | null,
): keyof ReturnType<typeof createDeviceBreakdown> {
  return device === "mobile" || device === "tablet" || device === "desktop"
    ? device
    : "unknown";
}

function incrementDailyCount(
  map: Map<string, Record<string, number>>,
  row: DailyCountRow,
) {
  const byDate = map.get(row.invitationSlug) ?? {};
  byDate[dateKey(row.date)] =
    (byDate[dateKey(row.date)] ?? 0) + toCount(row.count);
  map.set(row.invitationSlug, byDate);
}

export function composeInvitationAnalytics({
  invitations,
  pageViewSummaries,
  eventCounts,
  deviceCounts,
  dailyViews,
  rsvpCounts,
  dailyRsvps,
}: ComposeInvitationAnalyticsInput): InvitationAnalytics[] {
  const pageViewsBySlug = new Map(
    pageViewSummaries.map((row) => [row.invitationSlug, row]),
  );

  const eventCountsBySlug = new Map<string, Record<string, number>>();
  for (const row of eventCounts) {
    const byType = eventCountsBySlug.get(row.invitationSlug) ?? {};
    byType[row.type] = (byType[row.type] ?? 0) + toCount(row.count);
    eventCountsBySlug.set(row.invitationSlug, byType);
  }

  const devicesBySlug = new Map<
    string,
    ReturnType<typeof createDeviceBreakdown>
  >();
  for (const row of deviceCounts) {
    const breakdown =
      devicesBySlug.get(row.invitationSlug) ?? createDeviceBreakdown();
    breakdown[normalizeDevice(row.device)] += toCount(row.count);
    devicesBySlug.set(row.invitationSlug, breakdown);
  }

  const dailyViewsBySlug = new Map<string, Record<string, number>>();
  for (const row of dailyViews) incrementDailyCount(dailyViewsBySlug, row);

  const rsvpCountsBySlug = new Map(
    rsvpCounts.map((row) => [row.invitationSlug, toCount(row.count)]),
  );

  const dailyRsvpsBySlug = new Map<string, Record<string, number>>();
  for (const row of dailyRsvps) incrementDailyCount(dailyRsvpsBySlug, row);

  return invitations
    .filter((invitation) => !invitation.isDemo)
    .map((invitation) => {
      const couple = asObj(invitation.couple);
      const pageViews = pageViewsBySlug.get(invitation.slug);
      const eventCount = eventCountsBySlug.get(invitation.slug) ?? {};
      const totalViews = toCount(pageViews?.totalViews);
      const uniqueVisitors = toCount(pageViews?.uniqueVisitors);
      const envelopeOpens = eventCount.envelope_open ?? 0;
      const rsvpCount = rsvpCountsBySlug.get(invitation.slug) ?? 0;
      const eventBreakdown: Record<string, number> = {};

      for (const type of INTERACTION_EVENT_TYPES) {
        eventBreakdown[type] = eventCount[type] ?? 0;
      }

      const viewsByDay = dailyViewsBySlug.get(invitation.slug) ?? {};
      const rsvpsByDay = dailyRsvpsBySlug.get(invitation.slug) ?? {};
      const allDays = new Set([
        ...Object.keys(viewsByDay),
        ...Object.keys(rsvpsByDay),
      ]);

      return {
        slug: invitation.slug,
        coupleName: `${str(couple.bride, "Noiva")} & ${str(couple.groom, "Noivo")}`,
        template: invitation.theme.name,
        createdAt: toIsoString(invitation.createdAt),
        totalViews,
        uniqueVisitors,
        envelopeOpens,
        openRate:
          totalViews > 0
            ? ((envelopeOpens / totalViews) * 100).toFixed(1)
            : "0",
        rsvpCount,
        conversionRate:
          totalViews > 0 ? ((rsvpCount / totalViews) * 100).toFixed(1) : "0",
        eventBreakdown,
        deviceBreakdown:
          devicesBySlug.get(invitation.slug) ?? createDeviceBreakdown(),
        viewsOverTime: Array.from(allDays)
          .sort()
          .map((date) => ({
            date,
            views: viewsByDay[date] ?? 0,
            rsvps: rsvpsByDay[date] ?? 0,
          })),
        recentRsvps: invitation.rsvpResponses.map((rsvp) => ({
          id: rsvp.id,
          guestName: rsvp.guestName,
          attending: rsvp.attending,
          submittedAt: toIsoString(rsvp.submittedAt),
        })),
      };
    });
}

export function resolveAnalyticsSlug(
  slug: string | null | undefined,
  options: AnalyticsInvitationOption[],
): string | null {
  if (slug && options.some((option) => option.slug === slug)) return slug;
  return options[0]?.slug ?? null;
}

export async function getAnalyticsInvitationOptions(): Promise<
  AnalyticsInvitationOption[]
> {
  const invitations = await prisma.invitation.findMany({
    where: { isDemo: false },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      couple: true,
    },
  });

  return invitations.map((invitation) => {
    const couple = asObj(invitation.couple);

    return {
      slug: invitation.slug,
      coupleName: `${str(couple.bride, "Noiva")} & ${str(couple.groom, "Noivo")}`,
    };
  });
}

export async function getInvitationAnalytics({
  range,
  slug,
}: {
  range: string;
  slug?: string | null;
}): Promise<InvitationAnalytics[]> {
  const selectedSlug = normalizeSelectedSlug(slug);
  const rangeStart = getRangeStart(range);
  const invitationWhere = selectedSlug
    ? { slug: selectedSlug, isDemo: false }
    : { isDemo: false };
  const rsvpWhere = rangeStart
    ? { submittedAt: { gte: rangeStart } }
    : undefined;

  const invitations = await prisma.invitation.findMany({
    where: invitationWhere,
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      couple: true,
      createdAt: true,
      isDemo: true,
      theme: { select: { name: true } },
      rsvpResponses: {
        where: rsvpWhere,
        select: {
          id: true,
          guestName: true,
          attending: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
    },
  });

  if (invitations.length === 0) return [];

  const slugCondition = selectedSlug
    ? Prisma.sql`AND "invitationSlug" = ${selectedSlug}`
    : Prisma.empty;
  const eventDateCondition = rangeStart
    ? Prisma.sql`AND "createdAt" >= ${rangeStart}`
    : Prisma.empty;
  const rsvpDateCondition = rangeStart
    ? Prisma.sql`AND "submittedAt" >= ${rangeStart}`
    : Prisma.empty;

  const [
    pageViewSummaries,
    eventCounts,
    deviceCounts,
    dailyViews,
    rsvpCounts,
    dailyRsvps,
  ] = await Promise.all([
    prisma.$queryRaw<PageViewSummaryRow[]>(Prisma.sql`
      SELECT
        "invitationSlug",
        COUNT(*)::int AS "totalViews",
        COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors"
      FROM "InvitationEvent"
      WHERE "type" = 'page_view'
        ${eventDateCondition}
        ${slugCondition}
      GROUP BY "invitationSlug"
    `),
    prisma.$queryRaw<EventCountRow[]>(Prisma.sql`
      SELECT
        "invitationSlug",
        "type",
        COUNT(*)::int AS "count"
      FROM "InvitationEvent"
      WHERE "type" IN (${Prisma.join([...COUNTED_EVENT_TYPES])})
        ${eventDateCondition}
        ${slugCondition}
      GROUP BY "invitationSlug", "type"
    `),
    prisma.$queryRaw<DeviceCountRow[]>(Prisma.sql`
      SELECT
        "invitationSlug",
        COALESCE("device", 'unknown') AS "device",
        COUNT(*)::int AS "count"
      FROM "InvitationEvent"
      WHERE "type" = 'page_view'
        ${eventDateCondition}
        ${slugCondition}
      GROUP BY "invitationSlug", COALESCE("device", 'unknown')
    `),
    prisma.$queryRaw<DailyCountRow[]>(Prisma.sql`
      SELECT
        "invitationSlug",
        "createdAt"::date::text AS "date",
        COUNT(*)::int AS "count"
      FROM "InvitationEvent"
      WHERE "type" = 'page_view'
        ${eventDateCondition}
        ${slugCondition}
      GROUP BY "invitationSlug", "createdAt"::date
      ORDER BY "date" ASC
    `),
    prisma.$queryRaw<RsvpCountRow[]>(Prisma.sql`
      SELECT
        "invitationSlug",
        COUNT(*)::int AS "count"
      FROM "RsvpResponse"
      WHERE 1 = 1
        ${rsvpDateCondition}
        ${slugCondition}
      GROUP BY "invitationSlug"
    `),
    prisma.$queryRaw<DailyCountRow[]>(Prisma.sql`
      SELECT
        "invitationSlug",
        "submittedAt"::date::text AS "date",
        COUNT(*)::int AS "count"
      FROM "RsvpResponse"
      WHERE 1 = 1
        ${rsvpDateCondition}
        ${slugCondition}
      GROUP BY "invitationSlug", "submittedAt"::date
      ORDER BY "date" ASC
    `),
  ]);

  return composeInvitationAnalytics({
    invitations,
    pageViewSummaries,
    eventCounts,
    deviceCounts,
    dailyViews,
    rsvpCounts,
    dailyRsvps,
  });
}
