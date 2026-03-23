import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getThemes } from "@/lib/themes";
import type { InvitationData, SaveDateStyle } from "@/lib/types";
import InvitationForm from "../../InvitationForm";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, themes] = await Promise.all([
    prisma.invitation.findUnique({
      where: { id },
      include: { theme: true },
    }),
    getThemes(),
  ]);

  if (!row) {
    notFound();
  }

  // Build absolute owner URL
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const ownerUrl = `${proto}://${host}/confirmacoes/${row.ownerToken}`;

  // Convert Prisma row to InvitationData shape for the form
  const initialData: InvitationData & { id: string } = {
    id: row.id,
    slug: row.slug,
    themeId: row.themeId,
    template: row.theme.name,
    couple: row.couple as unknown as InvitationData["couple"],
    date: row.date as unknown as InvitationData["date"],
    quote: row.quote,
    location: row.location as unknown as InvitationData["location"],
    rsvp: row.rsvp as unknown as InvitationData["rsvp"],
    schedule: row.schedule as unknown as InvitationData["schedule"],
    dressCode: row.dressCode,
    giftRegistry: row.giftRegistry as unknown as InvitationData["giftRegistry"],
    audio: row.audio as unknown as InvitationData["audio"],
    heroImage: row.heroImage,
    videoUrl: row.videoUrl ?? undefined,
    faqs: (row.faqs as unknown as InvitationData["faqs"]) ?? undefined,
    envelope:
      (row.envelope as unknown as InvitationData["envelope"]) ?? undefined,
    guestGuide:
      (row.guestGuide as unknown as InvitationData["guestGuide"]) ?? undefined,
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
  };

  return (
    <InvitationForm
      mode="edit"
      initialData={initialData}
      invitationId={row.id}
      ownerUrl={ownerUrl}
      themes={themes}
    />
  );
}
