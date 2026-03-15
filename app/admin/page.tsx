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
import { TrendingUp, TrendingDown, Heart, Users, BarChart3, Percent } from "lucide-react";

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
    0
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
              Total Invitations
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
              <span>Trending up this month</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Active invitations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total RSVPs
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
              <span>Down 20% this period</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Responses received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Templates
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
              <span>Strong template usage</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Templates in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              RSVP Rate
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
              <span>Steady performance increase</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Meets growth projections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invitations</CardTitle>
              <CardDescription>
                Manage all wedding invitations
              </CardDescription>
            </div>
            <Link
              href="/admin/invitations/new"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              + New Invitation
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <p className="text-lg">No invitations yet</p>
              <p className="text-sm mt-1">
                Create your first invitation to get started.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Couple</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">RSVPs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const couple = inv.couple as {
                      bride: string;
                      groom: string;
                    };
                    const date = inv.date as { display: string };

                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {couple.bride} & {couple.groom}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {inv.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{inv.template}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {date.display}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {inv._count.rsvpResponses}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/${inv.slug}`}
                              target="_blank"
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "sm",
                                })
                              )}
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/invitations/${inv.id}/edit`}
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "sm",
                                })
                              )}
                            >
                              Edit
                            </Link>
                            <DeleteInvitationButton
                              id={inv.id}
                              coupleName={`${couple.bride} & ${couple.groom}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Area */}
      <DashboardCharts />
    </div>
  );
}
