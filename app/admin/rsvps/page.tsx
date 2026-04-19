import { prisma } from "@/lib/db";
import { RsvpsClient } from "./RsvpsClient";

export const dynamic = "force-dynamic";

export default async function AdminRsvpsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string; std?: string; tab?: string }>;
}) {
  const { invitation: selectedSlug, std: selectedStdSlug, tab } = await searchParams;

  // ---------------------------------------------------------------------------
  // Invitations
  // ---------------------------------------------------------------------------
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

  const responses = await prisma.rsvpResponse.findMany({
    where: selectedSlug ? { invitationSlug: selectedSlug } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      invitation: {
        select: { id: true, slug: true, couple: true, theme: { select: { name: true } } },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Save the Dates (only those with RSVP enabled)
  // ---------------------------------------------------------------------------
  const saveDates = await prisma.saveTheDate.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      couple: true,
      rsvp: true,
      theme: { select: { name: true } },
      _count: { select: { rsvpResponses: true } },
    },
  });

  // Only expose STDs that have RSVP enabled
  const saveDatesWithRsvp = saveDates.filter(
    (s) => (s.rsvp as { enabled?: boolean } | null)?.enabled === true,
  );

  const stdResponses = await prisma.saveTheDateRsvpResponse.findMany({
    where: selectedStdSlug ? { saveTheDateSlug: selectedStdSlug } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      saveTheDate: {
        select: { id: true, slug: true, couple: true, theme: { select: { name: true } } },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Shape for client
  // ---------------------------------------------------------------------------
  const invitationRows = invitations.map((inv) => ({
    ...inv,
    couple: inv.couple as { bride: string; groom: string },
    template: inv.theme.name,
  }));

  const responseRows = responses.map((r) => ({
    ...r,
    invitation: { ...r.invitation, couple: r.invitation.couple as { bride: string; groom: string }, template: r.invitation.theme.name },
  }));

  const saveDateRows = saveDatesWithRsvp.map((s) => ({
    id: s.id,
    slug: s.slug,
    couple: s.couple as { bride: string; groom: string },
    template: s.theme.name,
    _count: s._count,
  }));

  const stdResponseRows = stdResponses.map((r) => ({
    ...r,
    saveTheDate: { ...r.saveTheDate, couple: r.saveTheDate.couple as { bride: string; groom: string }, template: r.saveTheDate.theme.name },
  }));

  return (
    <RsvpsClient
      invitations={invitationRows as unknown as InvitationSummary[]}
      responses={responseRows as unknown as RsvpResponseWithInvitation[]}
      selectedSlug={selectedSlug ?? null}
      saveDates={saveDateRows as unknown as SaveDateSummary[]}
      stdResponses={stdResponseRows as unknown as StdRsvpResponseWithSaveDate[]}
      selectedStdSlug={selectedStdSlug ?? null}
      activeTab={(tab === "std" ? "std" : "invitations") as "invitations" | "std"}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

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

export type SaveDateSummary = {
  id: string;
  slug: string;
  couple: { bride: string; groom: string };
  template: string;
  _count: { rsvpResponses: number };
};

export type StdRsvpResponseWithSaveDate = {
  id: string;
  saveTheDateSlug: string;
  guestName: string;
  email: string | null;
  attending: boolean;
  dietaryRestrictions: string | null;
  message: string | null;
  submittedAt: Date | string;
  saveTheDate: {
    id: string;
    slug: string;
    couple: { bride: string; groom: string };
    template: string;
  };
};
