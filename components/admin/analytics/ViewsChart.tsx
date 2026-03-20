"use client";

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

interface ViewsOverTimeEntry {
  date: string;
  views: number;
  rsvps: number;
}

interface ViewsChartProps {
  data: ViewsOverTimeEntry[];
}

const chartConfig = {
  views: {
    label: "Visualizações",
    color: "var(--chart-1)",
  },
  rsvps: {
    label: "Confirmações",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function ViewsChart({ data }: ViewsChartProps) {
  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  if (formatted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitas ao Longo do Tempo</CardTitle>
          <CardDescription>Nenhum dado no período selecionado</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
          Aguardando primeiras visitas...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitas ao Longo do Tempo</CardTitle>
        <CardDescription>Visualizações e confirmações diárias</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <AreaChart
            data={formatted}
            margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillRsvps" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-2)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-2)"
                  stopOpacity={0.05}
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
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="views"
              type="natural"
              fill="url(#fillViews)"
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
            <Area
              dataKey="rsvps"
              type="natural"
              fill="url(#fillRsvps)"
              stroke="var(--chart-2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
