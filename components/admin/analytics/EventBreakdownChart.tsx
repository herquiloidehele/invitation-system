"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

interface EventBreakdownChartProps {
  data: Record<string, number>;
}

const LABELS: Record<string, string> = {
  maps_click: "Google Maps",
  waze_click: "Waze",
  gift_click: "Lista de Presentes",
  audio_play: "Música",
  calendar_click: "Calendário",
  rsvp_submit: "RSVP",
};

const chartConfig = {
  count: {
    label: "Cliques",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function EventBreakdownChart({ data }: EventBreakdownChartProps) {
  const chartData = Object.entries(LABELS)
    .map(([key, label]) => ({ label, count: data[key] ?? 0 }))
    .filter((d) => d.count > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interações</CardTitle>
          <CardDescription>Cliques por tipo de ação</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
          Nenhuma interação registrada ainda
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interações</CardTitle>
        <CardDescription>Cliques por tipo de ação</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
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
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
