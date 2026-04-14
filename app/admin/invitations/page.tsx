import { prisma } from "@/lib/db";
import { InvitationsClient } from "./InvitationsClient";

export const dynamic = "force-dynamic";

export type InvitationRow = {
  id: string;
  slug: string;
  template: string;
  couple: { bride: string; groom: string; monogram?: string };
  date: { display: string; iso?: string };
  rsvp: { enabled: boolean };
  createdAt: Date | string;
  _count: { rsvpResponses: number };
};

export default async function AdminInvitationsPage() {
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      model: { select: { name: true } },
      couple: true,
      date: true,
      rsvp: true,
      createdAt: true,
      _count: { select: { rsvpResponses: true } },
    },
  });

  // Flatten model.name → template for the client component
  const rows = invitations.map((inv) => ({
    ...inv,
    template: inv.model.name,
  }));

  return <InvitationsClient invitations={rows as unknown as InvitationRow[]} />;
}
