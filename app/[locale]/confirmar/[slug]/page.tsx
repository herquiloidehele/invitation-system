import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type {
  CustomTexts,
  InvitationEventType,
  TemplateTheme,
} from "@/lib/types";
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

function isDeadlinePassed(deadline: string | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

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
      cinematicImageUrl: true,
      videoUrl: true,
      videoPoster: true,
      heroImage: true,
      envelope: true,
      theme: true,
    },
  });

  if (!invitation) notFound();

  const couple = invitation.couple as {
    bride: string;
    groom: string;
    monogram?: string;
  };
  const date = invitation.date as {
    display: string;
    iso?: string;
    time?: string;
  };
  const rsvp = invitation.rsvp as {
    enabled?: boolean;
    deadline?: string;
    showEmail?: boolean;
    showDietaryRestrictions?: boolean;
    backgroundImageUrl?: string;
  };
  const customTexts =
    (invitation.customTexts as CustomTexts | null) ?? undefined;
  const theme = invitation.theme as unknown as TemplateTheme;

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
      monogram={couple.monogram}
      dateDisplay={dateDisplay}
      dateIso={date.iso}
      dateTime={date.time}
      deadline={rsvp.deadline}
      deadlinePassed={deadlinePassed}
      showEmail={shouldShowRsvpEmail(rsvp)}
      showDietaryRestrictions={shouldShowRsvpDietaryRestrictions(rsvp)}
      adminBackgroundOverride={rsvp.backgroundImageUrl}
      cinematicImageUrl={invitation.cinematicImageUrl ?? undefined}
      videoUrl={invitation.videoUrl ?? undefined}
      videoPoster={invitation.videoPoster ?? undefined}
      heroImage={invitation.heroImage}
      theme={theme}
      customTexts={customTexts}
    />
  );
}
