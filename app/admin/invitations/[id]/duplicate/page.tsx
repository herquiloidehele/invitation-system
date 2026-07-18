import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildDuplicateInvitationInitialData } from "@/lib/invitation-duplication";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import { getThemes } from "@/lib/themes";
import ExternalInvitationForm from "../../ExternalInvitationForm";
import InvitationForm from "../../InvitationForm";

export const dynamic = "force-dynamic";

export default async function DuplicateInvitationPage({
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

  if (!row) notFound();

  const initialData = buildDuplicateInvitationInitialData(row);
  const sourceCustomerName = buildInvitationDisplayName({
    eventType: initialData.eventType,
    primaryName: initialData.couple.bride,
    secondaryName: initialData.couple.groom,
  });
  const sharedProps = {
    initialData,
    sourceInvitationId: row.id,
    sourceCustomerName,
    themes,
  };
  const isExternal =
    initialData.invitationType === "external_video" ||
    initialData.invitationType === "external_link";

  return isExternal ? (
    <ExternalInvitationForm mode="duplicate" {...sharedProps} />
  ) : (
    <InvitationForm mode="duplicate" {...sharedProps} />
  );
}
