import { prisma } from "@/lib/db";
import { InvitationsClient } from "./InvitationsClient";

export const dynamic = "force-dynamic";

export type InvitationRow = {
  id: string;
  slug: string;
  template: string;
  couple: { bride: string; groom: string; monogram?: string };
  eventType: "wedding" | "anniversary" | "baptism" | "engagement" | "other";
  isDemo: boolean;
  /** Set when an admin blocked the invitation (null = live). */
  blockedAt: Date | string | null;
  blockedReason: string | null;
  date: { display: string; iso?: string };
  rsvp: { enabled: boolean };
  /** "standard" | "ai" — AI invitations route to their own builder page. */
  renderMode: string;
  /** Catalogue name shown for demos (null for customer invitations). */
  landingModelName: string | null;
  createdAt: Date | string;
  _count: { rsvpResponses: number };
};

export default async function AdminInvitationsPage() {
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      theme: { select: { name: true } },
      couple: true,
      eventType: true,
      isDemo: true,
      blockedAt: true,
      blockedReason: true,
      date: true,
      rsvp: true,
      renderMode: true,
      landingModelName: true,
      createdAt: true,
      _count: { select: { rsvpResponses: true } },
    },
  });

  // Flatten theme.name → template for the client component
  const rows = invitations.map((inv) => ({
    ...inv,
    template: inv.theme.name,
  }));

  return <InvitationsClient invitations={rows as unknown as InvitationRow[]} />;
}
