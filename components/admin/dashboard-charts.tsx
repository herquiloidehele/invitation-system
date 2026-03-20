"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface ChartEntry {
  date: string;
  visitors: number;
  rsvps: number;
}

const chartConfig = {
  visitors: {
    label: "Visitantes",
    color: "var(--chart-1)",
  },
  rsvps: {
    label: "Confirmações",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function getRangeMs(range: string) {
  switch (range) {
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function DashboardCharts() {
  const [timeRange, setTimeRange] = React.useState("30d");
  const [data, setData] = React.useState<ChartEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${timeRange}`)
      .then((r) => r.json())
      .then(
        (
          invitations: Array<{
            viewsOverTime: { date: string; views: number; rsvps: number }[];
            recentRsvps: { submittedAt: string }[];
          }>,
        ) => {
          // Merge time series across all invitations
          const map: Record<string, { visitors: number; rsvps: number }> = {};
          for (const inv of invitations) {
            for (const entry of inv.viewsOverTime) {
              if (!map[entry.date]) map[entry.date] = { visitors: 0, rsvps: 0 };
              map[entry.date].visitors += entry.views;
              map[entry.date].rsvps += entry.rsvps;
            }
          }
          const merged = Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({
              date: formatDate(date),
              visitors: v.visitors,
              rsvps: v.rsvps,
            }));
          setData(merged);
        },
      )
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [timeRange]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Total de Visitantes</CardTitle>
          <CardDescription>
            {timeRange === "90d"
              ? "Últimos 3 meses"
              : timeRange === "30d"
                ? "Últimos 30 dias"
                : "Últimos 7 dias"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
          <button
            onClick={() => setTimeRange("90d")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeRange === "90d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3 meses
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeRange === "30d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setTimeRange("7d")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeRange === "7d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            7 dias
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            Carregando dados...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            Nenhuma visita registrada ainda
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillRsvps" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                className="text-xs"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="rsvps"
                type="natural"
                fill="url(#fillRsvps)"
                stroke="var(--chart-2)"
                stackId="a"
                strokeWidth={2}
              />
              <Area
                dataKey="visitors"
                type="natural"
                fill="url(#fillVisitors)"
                stroke="var(--chart-1)"
                stackId="a"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
