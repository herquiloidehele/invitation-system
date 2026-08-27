import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createNoIndexMetadata } from "@/lib/seo";
import PassView from "./PassView";

export const dynamic = "force-dynamic";
export const metadata = createNoIndexMetadata();

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ c?: string }>;
};

export default async function PassPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { c } = await searchParams;
  if (!c) notFound();

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { slug: true, checkInEnabled: true, qrCodeStyle: true },
  });
  if (!invitation || !invitation.checkInEnabled) notFound();

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
