"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { ViewsChart } from "@/components/admin/analytics/ViewsChart";
import { EventBreakdownChart } from "@/components/admin/analytics/EventBreakdownChart";
import { DeviceChart } from "@/components/admin/analytics/DeviceChart";
import { RecentRsvpsTable } from "@/components/admin/analytics/RecentRsvpsTable";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AnalyticsInvitationOption,
  InvitationAnalytics,
} from "@/lib/admin-analytics";

export type { InvitationAnalytics } from "@/lib/admin-analytics";

const RANGES = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
  { label: "Tudo", value: "all" },
];

interface AnalyticsClientProps {
  data: InvitationAnalytics[];
  invitationOptions: AnalyticsInvitationOption[];
  range: string;
  selectedSlug: string;
}

export default function AnalyticsClient({
  data,
  invitationOptions,
  range,
  selectedSlug,
}: AnalyticsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const current =
    selectedSlug === "all"
      ? null
      : (data.find((d) => d.slug === selectedSlug) ?? data[0] ?? null);

  // Aggregate stats when "all" is selected
  const aggregate = {
    totalViews: data.reduce((s, d) => s + d.totalViews, 0),
    uniqueVisitors: data.reduce((s, d) => s + d.uniqueVisitors, 0),
    envelopeOpens: data.reduce((s, d) => s + d.envelopeOpens, 0),
    rsvpCount: data.reduce((s, d) => s + d.rsvpCount, 0),
    get openRate() {
      return this.totalViews > 0
        ? ((this.envelopeOpens / this.totalViews) * 100).toFixed(1)
        : "0";
    },
    get conversionRate() {
      return this.totalViews > 0
        ? ((this.rsvpCount / this.totalViews) * 100).toFixed(1)
        : "0";
    },
  };

  const stats = current ?? aggregate;
  const viewsOverTime = current
    ? current.viewsOverTime
    : mergeTimeSeries(data.map((d) => d.viewsOverTime));
  const eventBreakdown = current
    ? current.eventBreakdown
    : mergeEventBreakdown(data.map((d) => d.eventBreakdown));
  const deviceBreakdown = current
    ? current.deviceBreakdown
    : mergeDeviceBreakdown(data.map((d) => d.deviceBreakdown));
  const recentRsvps = current
    ? current.recentRsvps
    : data
        .flatMap((d) => d.recentRsvps)
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        )
        .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Invitation selector */}
        <Select
          value={selectedSlug}
          onValueChange={(value) => updateParam("slug", value || "")}
        >
          <SelectTrigger className="w-full min-w-64 sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">Todos os Convites</SelectItem>
            {invitationOptions.map((inv) => (
              <SelectItem key={inv.slug} value={inv.slug}>
                {inv.coupleName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Range selector */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => updateParam("range", r.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === r.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Atualizando...
        </div>
      )}

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhum convite encontrado</p>
          <p className="text-sm">
            Crie um convite para começar a ver as analíticas.
          </p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <StatsCards
            totalViews={stats.totalViews}
            uniqueVisitors={stats.uniqueVisitors}
            envelopeOpens={stats.envelopeOpens}
            openRate={stats.openRate}
            rsvpCount={stats.rsvpCount}
            conversionRate={stats.conversionRate}
          />

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ViewsChart data={viewsOverTime} />
            </div>
            <DeviceChart data={deviceBreakdown} />
          </div>

          {/* Event breakdown */}
          <EventBreakdownChart data={eventBreakdown} />

          {/* Recent RSVPs */}
          <RecentRsvpsTable rsvps={recentRsvps} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function mergeTimeSeries(
  series: { date: string; views: number; rsvps: number }[][],
): { date: string; views: number; rsvps: number }[] {
  const map: Record<string, { views: number; rsvps: number }> = {};
  for (const s of series) {
    for (const entry of s) {
      if (!map[entry.date]) map[entry.date] = { views: 0, rsvps: 0 };
      map[entry.date].views += entry.views;
      map[entry.date].rsvps += entry.rsvps;
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

function mergeEventBreakdown(
  breakdowns: Record<string, number>[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const bd of breakdowns) {
    for (const [k, v] of Object.entries(bd)) {
      result[k] = (result[k] ?? 0) + v;
    }
  }
  return result;
}

function mergeDeviceBreakdown(
  breakdowns: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  }[],
) {
  return breakdowns.reduce(
    (acc, d) => ({
      mobile: acc.mobile + d.mobile,
      tablet: acc.tablet + d.tablet,
      desktop: acc.desktop + d.desktop,
      unknown: acc.unknown + (d.unknown ?? 0),
    }),
    { mobile: 0, tablet: 0, desktop: 0, unknown: 0 },
  );
}
