import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getModels } from "@/lib/models";
import type {
  InvitationData,
  InvitationType,
  ImageSettingsMap,
  ParentsInfo,
  SectionImages,
  OurStory,
  InvitationStyles,
} from "@/lib/types";
import InvitationForm from "../../InvitationForm";
import ExternalInvitationForm from "../../ExternalInvitationForm";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, models] = await Promise.all([
    prisma.invitation.findUnique({
      where: { id },
      include: { model: true },
    }),
    getModels(),
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
    modelId: row.modelId,
    modelComponent: row.model.component,
    styles: row.styles as unknown as InvitationStyles,
    couple: row.couple as unknown as InvitationData["couple"],
    date: row.date as unknown as InvitationData["date"],
    quote: row.quote,
    location: row.location as unknown as InvitationData["location"],
    location2:
      (row.location2 as unknown as InvitationData["location2"]) ?? undefined,
    rsvp: row.rsvp as unknown as InvitationData["rsvp"],
    schedule: row.schedule as unknown as InvitationData["schedule"],
    dressCode: row.dressCode as unknown as InvitationData["dressCode"],
    giftRegistry: row.giftRegistry as unknown as InvitationData["giftRegistry"],
    audio: row.audio as unknown as InvitationData["audio"],
    heroImage: row.heroImage,
    videoUrl: row.videoUrl ?? undefined,
    faqs: (row.faqs as unknown as InvitationData["faqs"]) ?? undefined,
    guestGuide:
      (row.guestGuide as unknown as InvitationData["guestGuide"]) ?? undefined,
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    sectionImages:
      (row.sectionImages as unknown as SectionImages | null) ?? undefined,
    parents: (row.parents as unknown as ParentsInfo | null) ?? undefined,
    ourStory: (row.ourStory as unknown as OurStory | null) ?? undefined,
    imageSettings:
      (row.imageSettings as unknown as ImageSettingsMap | null) ?? undefined,
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    externalLink: row.externalLink ?? undefined,
  };

  const isExternal =
    initialData.invitationType === "external_video" ||
    initialData.invitationType === "external_link";

  if (isExternal) {
    return (
      <ExternalInvitationForm
        mode="edit"
        initialData={initialData}
        invitationId={row.id}
        ownerUrl={ownerUrl}
        models={models}
      />
    );
  }

  return (
    <InvitationForm
      mode="edit"
      initialData={initialData}
      invitationId={row.id}
      ownerUrl={ownerUrl}
      models={models}
    />
  );
}
