import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Mail, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalViews: number;
  uniqueVisitors: number;
  envelopeOpens: number;
  openRate: string;
  rsvpCount: number;
  conversionRate: string;
}

export function StatsCards({
  totalViews,
  uniqueVisitors,
  envelopeOpens,
  openRate,
  rsvpCount,
  conversionRate,
}: StatsCardsProps) {
  const cards = [
    {
      title: "Visualizações",
      value: totalViews,
      sub: `${uniqueVisitors} únicos`,
      icon: Eye,
      color: "text-blue-500",
    },
    {
      title: "Envelopes Abertos",
      value: envelopeOpens,
      sub: `${openRate}% das visitas`,
      icon: Mail,
      color: "text-violet-500",
    },
    {
      title: "Confirmações (RSVP)",
      value: rsvpCount,
      sub: "respostas recebidas",
      icon: Users,
      color: "text-emerald-500",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      sub: "visitas → RSVP",
      icon: TrendingUp,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`size-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
