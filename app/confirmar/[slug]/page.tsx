import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { CustomTexts } from "@/lib/types";
import RsvpPage from "./RsvpPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// Deadline helper — tries to parse the deadline string and compare to now.
// Returns false (not passed) if the string cannot be parsed as a date.
// ---------------------------------------------------------------------------

function isDeadlinePassed(deadline: string | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ConfirmarPage({ params }: Props) {
  const { slug } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: {
      slug: true,
      couple: true,
      date: true,
      rsvp: true,
      customTexts: true,
    },
  });

  if (!invitation) notFound();

  const couple = invitation.couple as { bride: string; groom: string };
  const date = invitation.date as { display: string };
  const rsvp = invitation.rsvp as { enabled?: boolean; deadline?: string };
  const customTexts =
    (invitation.customTexts as CustomTexts | null) ?? undefined;

  const deadlinePassed = isDeadlinePassed(rsvp.deadline);

  return (
    <RsvpPage
      slug={slug}
      bride={couple.bride}
      groom={couple.groom}
      dateDisplay={date.display}
      deadline={rsvp.deadline}
      deadlinePassed={deadlinePassed}
      customTexts={customTexts}
    />
  );
}
