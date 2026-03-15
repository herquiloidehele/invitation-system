import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { InvitationData, TemplateName } from "@/lib/types";
import InvitationForm from "../../InvitationForm";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.invitation.findUnique({ where: { id } });

  if (!row) {
    notFound();
  }

  // Convert Prisma row to InvitationData shape for the form
  const initialData: InvitationData & { id: string } = {
    id: row.id,
    slug: row.slug,
    template: row.template as TemplateName,
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
  };

  return (
    <InvitationForm
      mode="edit"
      initialData={initialData}
      invitationId={row.id}
    />
  );
}
