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

  const current = data.find((d) => d.slug === selectedSlug) ?? data[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Invitation selector */}
        {invitationOptions.length > 0 && (
          <Select
            value={selectedSlug}
            onValueChange={(value) => {
              if (value) updateParam("slug", value);
            }}
          >
            <SelectTrigger className="w-full min-w-64 sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {invitationOptions.map((inv) => (
                <SelectItem key={inv.slug} value={inv.slug}>
                  {inv.coupleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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

      {!current ? (
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
            totalViews={current.totalViews}
            uniqueVisitors={current.uniqueVisitors}
            envelopeOpens={current.envelopeOpens}
            openRate={current.openRate}
            rsvpCount={current.rsvpCount}
            conversionRate={current.conversionRate}
          />

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ViewsChart data={current.viewsOverTime} />
            </div>
            <DeviceChart data={current.deviceBreakdown} />
          </div>

          {/* Event breakdown */}
          <EventBreakdownChart data={current.eventBreakdown} />

          {/* Recent RSVPs */}
          <RecentRsvpsTable rsvps={current.recentRsvps} />
        </>
      )}
    </div>
  );
}
