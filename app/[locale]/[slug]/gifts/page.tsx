import { notFound } from "next/navigation";

import GiftsListView from "@/components/gifts/GiftsListView";
import { hasGiftItems } from "@/lib/gift-registry";
import { getInvitation } from "@/lib/invitations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import { redirect } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function GiftsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { locale, slug } = await params;
  const { g: guestToken } = await searchParams;

  const invitation = await getInvitation(slug);
  if (!invitation) notFound();

  const theme = await getTheme(invitation.template);
  if (!theme) notFound();

  // Direct-URL guard: nothing to show → bounce back to the invitation.
  if (
    !invitation.giftRegistry?.enabled ||
    !hasGiftItems(invitation.giftRegistry)
  ) {
    redirect({
      href: `/${slug}${guestToken ? `?g=${encodeURIComponent(guestToken)}` : ""}`,
      locale,
    });
  }

  // Resolve the personal guest exactly like the main page (back link + context).
  let guest = undefined;
  if (guestToken && invitation.guestManagementEnabled) {
    const found = await getPublicGuestByToken(guestToken);
    if (found && found.invitationSlug === slug) guest = found;
  }

  return (
    <GiftsListView
      invitation={{ ...invitation, guest }}
      theme={theme}
      slug={slug}
      guestToken={guest?.token}
    />
  );
}
