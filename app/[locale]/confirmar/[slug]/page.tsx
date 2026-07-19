import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/locales";
import {
  getInvitationLocaleRedirectPath,
  getInvitationSearchParam,
  type InvitationSearchParams,
} from "@/lib/invitation-language-routing";
import { localizeInvitation } from "@/lib/invitation-translations";
import { getInvitation } from "@/lib/invitations";
import {
  getRsvpCustomFields,
  isRsvpClosed,
  shouldShowRsvpCompanion,
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
  shouldShowRsvpNumAdults,
  shouldShowRsvpNumChildren,
} from "@/lib/rsvp-config";
import { buildLocalePath, createNoIndexMetadata } from "@/lib/seo";
import { formatLocalizedLongDate } from "@/lib/date-format";
import { getPublicGuestByToken } from "@/lib/guests";
import RsvpPage from "./RsvpPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createNoIndexMetadata();

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<InvitationSearchParams>;
};

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

export default async function ConfirmarPage({ params, searchParams }: Props) {
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const resolvedSearchParams = await searchParams;
  const guestToken = getInvitationSearchParam(resolvedSearchParams, "g");

  const sourceInvitation = await getInvitation(slug);
  if (!sourceInvitation) notFound();

  const pathname = buildLocalePath(`/confirmar/${slug}`, locale);
  const redirectPath = getInvitationLocaleRedirectPath(
    sourceInvitation,
    locale,
    pathname,
    resolvedSearchParams,
  );
  if (redirectPath) redirect(redirectPath);

  const invitation =
    sourceInvitation.invitationType === "standard"
      ? localizeInvitation(sourceInvitation, locale)
      : sourceInvitation;
  const { couple, date, rsvp, customTexts } = invitation;

  const deadlinePassed = isDeadlinePassed(rsvp.deadline);
  const closed = isRsvpClosed(rsvp);
  const dateDisplay = date.iso
    ? formatLocalizedLongDate(date.iso, locale, date.display)
    : date.display;

  // When the Canva confirm link carried `?g=<token>`, resolve the guest (scoped
  // to this invitation) so the RSVP prefills the name and links to the guest.
  let guestName: string | undefined;
  let resolvedGuestToken: string | undefined;
  if (guestToken) {
    const guest = await getPublicGuestByToken(guestToken);
    if (guest && guest.invitationSlug === slug) {
      guestName = guest.name;
      resolvedGuestToken = guest.token;
    }
  }

  return (
    <RsvpPage
      slug={slug}
      guestToken={resolvedGuestToken}
      prefillName={guestName}
      eventType={invitation.eventType}
      bride={couple.bride}
      groom={couple.groom}
      dateDisplay={dateDisplay}
      deadline={rsvp.deadline}
      deadlinePassed={deadlinePassed}
      closed={closed}
      showEmail={shouldShowRsvpEmail(rsvp)}
      showDietaryRestrictions={shouldShowRsvpDietaryRestrictions(rsvp)}
      showCompanion={shouldShowRsvpCompanion(rsvp)}
      showNumAdults={shouldShowRsvpNumAdults(rsvp)}
      showNumChildren={shouldShowRsvpNumChildren(rsvp)}
      customFields={getRsvpCustomFields(rsvp)}
      backgroundImageUrl={rsvp.backgroundImageUrl}
      inputColors={rsvp}
      customTexts={customTexts}
    />
  );
}
