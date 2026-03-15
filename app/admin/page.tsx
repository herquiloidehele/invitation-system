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
import { cn } from "@/lib/utils";
import DeleteInvitationButton from "./DeleteInvitationButton";

export const dynamic = "force-dynamic";

export default async function AdminInvitationsPage() {
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { rsvpResponses: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Invitations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all wedding invitations
          </p>
        </div>
        <Link
          href="/admin/invitations/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          + New Invitation
        </Link>
      </div>

      {/* Table */}
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
                            buttonVariants({ variant: "ghost", size: "sm" }),
                          )}
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/invitations/${inv.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
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
    </div>
  );
}
