import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvitation } from "@/lib/invitations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import InvitationView from "./InvitationView";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveInvitationSocialPreview,
} from "@/lib/social-preview";

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

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { image, title, description } = resolveInvitationSocialPreview(
    invitation,
    siteOrigin,
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      url: `${siteOrigin}/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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
