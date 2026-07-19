import { notFound, redirect } from "next/navigation";

import GiftsListView from "@/components/gifts/GiftsListView";
import {
  hasGiftItems,
  isExclusiveGiftSelectionEnabled,
} from "@/lib/gift-registry";
import { getGiftAvailability } from "@/lib/gift-reservations";
import { getInvitation } from "@/lib/invitations";
import {
  getInvitationLocaleRedirectPath,
  getInvitationSearchParam,
  serializeInvitationSearchParams,
  type InvitationSearchParams,
} from "@/lib/invitation-language-routing";
import { localizeInvitation } from "@/lib/invitation-translations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import { resolveLocale } from "@/i18n/locales";
import { buildLocalePath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function GiftsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<InvitationSearchParams>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const resolvedSearchParams = await searchParams;
  const guestToken = getInvitationSearchParam(resolvedSearchParams, "g");

  const sourceInvitation = await getInvitation(slug);
  if (!sourceInvitation) notFound();

  const pathname = buildLocalePath(`/${slug}/gifts`, locale);
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
  const theme = await getTheme(sourceInvitation.template);
  if (!theme) notFound();

  // Direct-URL guard: nothing to show → bounce back to the invitation.
  if (
    !invitation.giftRegistry?.enabled ||
    !hasGiftItems(invitation.giftRegistry)
  ) {
    const query = serializeInvitationSearchParams(resolvedSearchParams);
    redirect(
      `${buildLocalePath(`/${slug}`, locale)}${query ? `?${query}` : ""}`,
    );
  }

  // Resolve the personal guest exactly like the main page (back link + context).
  let guest = undefined;
  if (guestToken && sourceInvitation.guestManagementEnabled) {
    const found = await getPublicGuestByToken(guestToken);
    if (found && found.invitationSlug === slug) guest = found;
  }

  const initialAvailability = isExclusiveGiftSelectionEnabled(
    invitation.giftRegistry,
  )
    ? await getGiftAvailability({ slug, guestToken: guest?.token })
    : undefined;

  return (
    <GiftsListView
      invitation={{ ...invitation, guest }}
      theme={theme}
      slug={slug}
      guestToken={guest?.token}
      initialAvailability={initialAvailability}
    />
  );
}
