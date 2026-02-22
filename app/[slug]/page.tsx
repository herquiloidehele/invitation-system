import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvitation, getAllInvitations } from "@/lib/invitations";
import { themes } from "@/lib/themes";
import InvitationView from "./InvitationView";

// ---------------------------------------------------------------------------
// Static params — pre-generate all invitation pages at build time
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const invitations = getAllInvitations();
  return invitations.map((inv) => ({ slug: inv.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata per invitation
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = getInvitation(slug);

  if (!invitation) {
    return { title: "Convite não encontrado" };
  }

  const { bride, groom } = invitation.couple;

  return {
    title: `${bride} & ${groom} — Convite de Casamento`,
    description: `${bride} e ${groom} convidam você para celebrar o casamento em ${invitation.date.display}. ${invitation.quote}`,
    openGraph: {
      title: `${bride} & ${groom}`,
      description: `Casamento em ${invitation.date.display}`,
      images: invitation.heroImage ? [invitation.heroImage] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function InvitationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = getInvitation(slug);

  if (!invitation) {
    notFound();
  }

  const theme = themes[invitation.template];

  if (!theme) {
    notFound();
  }

  return <InvitationView invitation={invitation} theme={theme} />;
}
