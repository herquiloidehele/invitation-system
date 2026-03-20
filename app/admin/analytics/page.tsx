import { prisma } from "@/lib/db";
import AnalyticsClient, { type InvitationAnalytics } from "./AnalyticsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ range?: string; slug?: string }>;
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

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { range = "30d", slug = "all" } = await searchParams;
  const rangeStart = getRangeStart(range);
  const dateFilter = rangeStart ? { createdAt: { gte: rangeStart } } : {};

  const invitations = await prisma.invitation.findMany({
    where: slug !== "all" ? { slug } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      rsvpResponses: {
        where: rangeStart ? { submittedAt: { gte: rangeStart } } : undefined,
        select: {
          id: true,
          guestName: true,
          attending: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
      events: {
        where: dateFilter,
        select: {
          type: true,
          visitorId: true,
          sessionId: true,
          device: true,
          createdAt: true,
        },
      },
    },
  });

  const data: InvitationAnalytics[] = invitations.map((inv) => {
    const events = inv.events;
    const couple = inv.couple as { bride: string; groom: string };

    const totalViews = events.filter((e) => e.type === "page_view").length;
    const uniqueVisitors = new Set(
      events.filter((e) => e.type === "page_view").map((e) => e.visitorId),
    ).size;
    const envelopeOpens = events.filter(
      (e) => e.type === "envelope_open",
    ).length;
    const openRate =
      totalViews > 0 ? ((envelopeOpens / totalViews) * 100).toFixed(1) : "0";
    const rsvpCount = inv.rsvpResponses.length;
    const conversionRate =
      totalViews > 0 ? ((rsvpCount / totalViews) * 100).toFixed(1) : "0";

    const interactionTypes = [
      "maps_click",
      "waze_click",
      "gift_click",
      "audio_play",
      "calendar_click",
      "rsvp_submit",
    ];
    const eventBreakdown: Record<string, number> = {};
    for (const t of interactionTypes) {
      eventBreakdown[t] = events.filter((e) => e.type === t).length;
    }

    const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
    for (const e of events.filter((ev) => ev.type === "page_view")) {
      const d = (e.device ?? "unknown") as keyof typeof deviceBreakdown;
      if (d in deviceBreakdown) deviceBreakdown[d]++;
      else deviceBreakdown.unknown++;
    }

    const viewsByDay: Record<string, number> = {};
    const rsvpsByDay: Record<string, number> = {};
    for (const e of events.filter((ev) => ev.type === "page_view")) {
      const day = toDateStr(new Date(e.createdAt));
      viewsByDay[day] = (viewsByDay[day] ?? 0) + 1;
    }
    for (const r of inv.rsvpResponses) {
      const day = toDateStr(new Date(r.submittedAt));
      rsvpsByDay[day] = (rsvpsByDay[day] ?? 0) + 1;
    }
    const allDays = new Set([
      ...Object.keys(viewsByDay),
      ...Object.keys(rsvpsByDay),
    ]);
    const viewsOverTime = Array.from(allDays)
      .sort()
      .map((date) => ({
        date,
        views: viewsByDay[date] ?? 0,
        rsvps: rsvpsByDay[date] ?? 0,
      }));

    return {
      slug: inv.slug,
      coupleName: `${couple.bride} & ${couple.groom}`,
      template: inv.template,
      createdAt: inv.createdAt.toISOString(),
      totalViews,
      uniqueVisitors,
      envelopeOpens,
      openRate,
      rsvpCount,
      conversionRate,
      eventBreakdown,
      deviceBreakdown,
      viewsOverTime,
      recentRsvps: inv.rsvpResponses.map((r) => ({
        id: r.id,
        guestName: r.guestName,
        attending: r.attending,
        submittedAt: r.submittedAt.toISOString(),
      })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analíticas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe o desempenho dos seus convites em tempo real.
        </p>
      </div>
      <AnalyticsClient data={data} range={range} selectedSlug={slug} />
    </div>
  );
}
