"use client";

import { Pie, PieChart, Cell } from "recharts";
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

interface DeviceChartProps {
  data: { mobile: number; tablet: number; desktop: number; unknown?: number };
}

const chartConfig = {
  mobile: { label: "Mobile", color: "var(--chart-1)" },
  tablet: { label: "Tablet", color: "var(--chart-2)" },
  desktop: { label: "Desktop", color: "var(--chart-3)" },
} satisfies ChartConfig;

const COLORS = {
  mobile: "var(--chart-1)",
  tablet: "var(--chart-2)",
  desktop: "var(--chart-3)",
};

export function DeviceChart({ data }: DeviceChartProps) {
  const chartData = [
    { name: "mobile", value: data.mobile },
    { name: "tablet", value: data.tablet },
    { name: "desktop", value: data.desktop },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos</CardTitle>
          <CardDescription>Distribuição por dispositivo</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
          Nenhum dado ainda
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispositivos</CardTitle>
        <CardDescription>Distribuição das visitas por dispositivo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS] ?? "var(--chart-4)"}
                />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
