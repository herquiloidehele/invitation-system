import { prisma } from "@/lib/db";
import { RsvpsClient } from "./RsvpsClient";

export const dynamic = "force-dynamic";

export default async function AdminRsvpsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string }>;
}) {
  const { invitation: selectedSlug } = await searchParams;

  // Load all invitations for the filter dropdown
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      couple: true,
      theme: { select: { name: true } },
      _count: { select: { rsvpResponses: true } },
    },
  });

  // Load RSVPs — filtered by slug if provided
  const responses = await prisma.rsvpResponse.findMany({
    where: selectedSlug ? { invitationSlug: selectedSlug } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      invitation: {
        select: {
          id: true,
          slug: true,
          couple: true,
          theme: { select: { name: true } },
        },
      },
    },
  });

  // Flatten theme.name → template for client consumption
  const invitationRows = invitations.map((inv) => ({
    ...inv,
    template: inv.theme.name,
  }));

  const responseRows = responses.map((r) => ({
    ...r,
    invitation: {
      ...r.invitation,
      template: r.invitation.theme.name,
    },
  }));

  return (
    <RsvpsClient
      invitations={invitationRows as unknown as InvitationSummary[]}
      responses={responseRows as unknown as RsvpResponseWithInvitation[]}
      selectedSlug={selectedSlug ?? null}
    />
  );
}

// Types used across server + client boundary
export type InvitationSummary = {
  id: string;
  slug: string;
  couple: { bride: string; groom: string; monogram?: string };
  template: string;
  _count: { rsvpResponses: number };
};

export type RsvpResponseWithInvitation = {
  id: string;
  invitationSlug: string;
  guestName: string;
  email: string | null;
  attending: boolean;
  dietaryRestrictions: string | null;
  message: string | null;
  submittedAt: Date | string;
  invitation: {
    id: string;
    slug: string;
    couple: { bride: string; groom: string };
    template: string;
  };
};
