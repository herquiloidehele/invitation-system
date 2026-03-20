import Link from "next/link";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DeleteInvitationButton from "./DeleteInvitationButton";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import {
  TrendingUp,
  TrendingDown,
  Heart,
  Users,
  BarChart3,
  Percent,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { rsvpResponses: true },
      },
    },
  });

  const totalInvitations = invitations.length;
  const totalRsvps = invitations.reduce(
    (sum, inv) => sum + inv._count.rsvpResponses,
    0,
  );
  const activeTemplates = new Set(invitations.map((inv) => inv.template)).size;
  const avgRsvpRate =
    totalInvitations > 0
      ? ((totalRsvps / Math.max(totalInvitations, 1)) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Convites
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="size-3" />
              <span>+12.5%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvitations}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span>Em alta este mês</span>
            </p>
            <p className="text-xs text-muted-foreground">Convites ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Confirmações
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-rose-600">
              <TrendingDown className="size-3" />
              <span>-20%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRsvps}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingDown className="size-3 text-rose-500" />
              <span>Queda de 20% neste período</span>
            </p>
            <p className="text-xs text-muted-foreground">Respostas recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Modelos Ativos
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="size-3" />
              <span>+12.5%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTemplates}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span>Forte utilização de modelos</span>
            </p>
            <p className="text-xs text-muted-foreground">Modelos em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Confirmação
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="size-3" />
              <span>+4.5%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRsvpRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span>Crescimento constante</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Dentro das projeções de crescimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Area */}
      <DashboardCharts />
    </div>
  );
}
