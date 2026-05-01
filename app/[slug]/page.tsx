import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvitation } from "@/lib/invitations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import InvitationView from "./InvitationView";
import {
  buildInvitationDisplayName,
  isWeddingEventType,
} from "@/lib/invitation-event-types";

// ---------------------------------------------------------------------------
// Force dynamic rendering (data comes from the database)
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Dynamic metadata per invitation
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);

  if (!invitation) {
    return { title: "Convite não encontrado" };
  }

  const { bride, groom } = invitation.couple;
  const isWedding = isWeddingEventType(invitation.eventType);
  const invitationName = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: bride,
    secondaryName: groom,
  });

  return {
    title: isWedding
      ? `${invitationName} — Convite de Casamento`
      : `${invitationName} — Convite`,
    description: isWedding
      ? `${bride} e ${groom} convidam você para celebrar o casamento em ${invitation.date.display}. ${invitation.quote}`
      : `${invitationName} convida você para celebrar este momento em ${invitation.date.display}. ${invitation.quote}`,
    openGraph: {
      title: invitationName,
      description: isWedding
        ? `Casamento em ${invitation.date.display}`
        : `Evento em ${invitation.date.display}`,
      images: invitation.heroImage ? [invitation.heroImage] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function InvitationSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; n?: string }>;
}) {
  const { slug } = await params;
  const { g: guestToken } = await searchParams;

  const invitation = await getInvitation(slug);

  if (!invitation) {
    notFound();
  }

  const theme = await getTheme(invitation.template);

  if (!theme) {
    notFound();
  }

  // Look up the personal guest if a token was provided. Silently fall back
  // when the token does not exist, belongs to another invitation, or the
  // feature is disabled — the rest of the page still works normally.
  let guest = undefined;
  if (guestToken && invitation.guestManagementEnabled) {
    const found = await getPublicGuestByToken(guestToken);
    if (found && found.invitationSlug === slug) {
      guest = found;
    }
  }

  return (
    <InvitationView invitation={{ ...invitation, guest }} theme={theme} />
  );
}
