"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
} from "@/components/ui/chart";

const chartData = [
  { date: "Jun 24", visitors: 186, rsvps: 80 },
  { date: "Jun 25", visitors: 305, rsvps: 200 },
  { date: "Jun 26", visitors: 237, rsvps: 120 },
  { date: "Jun 27", visitors: 473, rsvps: 190 },
  { date: "Jun 28", visitors: 209, rsvps: 130 },
  { date: "Jun 29", visitors: 414, rsvps: 250 },
  { date: "Jun 30", visitors: 360, rsvps: 180 },
];

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

export function DashboardCharts() {
  const [timeRange, setTimeRange] = React.useState("7d");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Total de Visitantes</CardTitle>
          <CardDescription>Total dos últimos 3 meses</CardDescription>
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
            Últimos 3 meses
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeRange === "30d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => setTimeRange("7d")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeRange === "7d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Últimos 7 dias
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
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
      </CardContent>
    </Card>
  );
}
