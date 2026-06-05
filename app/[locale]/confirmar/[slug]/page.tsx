import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { CustomTexts, InvitationEventType } from "@/lib/types";
import {
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
} from "@/lib/rsvp-config";
import { createNoIndexMetadata } from "@/lib/seo";
import { formatLocalizedLongDate } from "@/lib/date-format";
import RsvpPage from "./RsvpPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createNoIndexMetadata();

type Props = { params: Promise<{ locale: string; slug: string }> };

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
  const { slug, locale } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: {
      slug: true,
      couple: true,
      date: true,
      rsvp: true,
      customTexts: true,
      eventType: true,
    },
  });

  if (!invitation) notFound();

  const couple = invitation.couple as { bride: string; groom: string };
  const date = invitation.date as { display: string; iso?: string };
  const rsvp = invitation.rsvp as {
    enabled?: boolean;
    deadline?: string;
    showEmail?: boolean;
    showDietaryRestrictions?: boolean;
    backgroundImageUrl?: string;
  };
  const customTexts =
    (invitation.customTexts as CustomTexts | null) ?? undefined;

  const deadlinePassed = isDeadlinePassed(rsvp.deadline);
  const dateDisplay = date.iso
    ? formatLocalizedLongDate(date.iso, locale, date.display)
    : date.display;

  return (
    <RsvpPage
      slug={slug}
      eventType={(invitation.eventType as InvitationEventType) ?? "wedding"}
      bride={couple.bride}
      groom={couple.groom}
      dateDisplay={dateDisplay}
      deadline={rsvp.deadline}
      deadlinePassed={deadlinePassed}
      showEmail={shouldShowRsvpEmail(rsvp)}
      showDietaryRestrictions={shouldShowRsvpDietaryRestrictions(rsvp)}
      backgroundImageUrl={rsvp.backgroundImageUrl}
      customTexts={customTexts}
    />
  );
}
