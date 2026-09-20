import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createNoIndexMetadata } from "@/lib/seo";
import { resolveLocale } from "@/i18n/locales";
import {
  getInvitationBlockState,
  invitationBlockSelect,
} from "@/lib/invitation-block";
import InvitationBlockedPage from "@/components/InvitationBlockedPage";
import PassView from "./PassView";

export const dynamic = "force-dynamic";
export const metadata = createNoIndexMetadata();

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ c?: string }>;
};

export default async function PassPage({ params, searchParams }: Props) {
  const { locale: rawLocale, slug } = await params;
  const { c } = await searchParams;
  if (!c) notFound();

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: {
      slug: true,
      checkInEnabled: true,
      qrCodeStyle: true,
      ...invitationBlockSelect,
    },
  });
  if (!invitation) notFound();

  const block = getInvitationBlockState(invitation);
  if (block) {
    return (
      <InvitationBlockedPage
        reason={block.reason}
        locale={resolveLocale(rawLocale)}
      />
    );
  }
  if (!invitation.checkInEnabled) notFound();

  const rsvp = await prisma.rsvpResponse.findUnique({
    where: { checkInToken: c },
    select: { checkInToken: true, invitationSlug: true, guestName: true },
  });
  if (!rsvp || rsvp.invitationSlug !== slug || !rsvp.checkInToken) notFound();

  return (
    <PassView
      slug={slug}
      checkInToken={rsvp.checkInToken}
      guestName={rsvp.guestName}
      qrStyle={
        (invitation.qrCodeStyle as import("@/lib/types").QrCodeStyle | null) ??
        undefined
      }
    />
  );
}
