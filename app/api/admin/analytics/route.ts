import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      return null; // "all"
  }
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";
  const slug = searchParams.get("slug"); // optional: single invitation

  const rangeStart = getRangeStart(range);
  const dateFilter = rangeStart ? { createdAt: { gte: rangeStart } } : {};

  // Fetch all invitations (with RSVP counts + events)
  const invitations = await prisma.invitation.findMany({
    where: slug ? { slug } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      theme: { select: { name: true } },
      _count: { select: { rsvpResponses: true } },
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

  const result = invitations.map((inv) => {
    const events = inv.events;

    // Totals
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

    // Event breakdown (exclude page_view / envelope_open to show interaction events)
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

    // Device breakdown
    const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
    for (const e of events.filter((ev) => ev.type === "page_view")) {
      const d = (e.device ?? "unknown") as keyof typeof deviceBreakdown;
      if (d in deviceBreakdown) deviceBreakdown[d]++;
      else deviceBreakdown.unknown++;
    }

    // Views over time (by day, last N days)
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

    // Build a sorted time series spanning the range
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

    // Couple display name
    const couple = inv.couple as { bride: string; groom: string };
    const coupleName = `${couple.bride} & ${couple.groom}`;

    return {
      slug: inv.slug,
      coupleName,
      template: inv.theme.name,
      createdAt: inv.createdAt,
      totalViews,
      uniqueVisitors,
      envelopeOpens,
      openRate,
      rsvpCount,
      conversionRate,
      eventBreakdown,
      deviceBreakdown,
      viewsOverTime,
      recentRsvps: inv.rsvpResponses,
    };
  });

  return NextResponse.json(result);
}
