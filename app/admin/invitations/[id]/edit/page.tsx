import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getThemes } from "@/lib/themes";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import { getGuestbookResponses } from "@/lib/invitations";
import { isMinimalismBrownLayout } from "@/lib/minimalism-brown";
import InvitationForm from "../../InvitationForm";
import ExternalInvitationForm from "../../ExternalInvitationForm";
import { IntakeHeaderActions } from "@/components/admin/IntakeHeaderActions";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";

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

  // AI invitations own their editing surface (builder + AI-specific settings).
  if (row.renderMode === "ai") {
    redirect(`/admin/invitations/${id}/ai`);
  }

  // Build absolute owner URL
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const ownerUrl = `${proto}://${host}/confirmacoes/${row.ownerToken}`;

  const initialData = toAdminInvitationInitialData(row);

  // Customer intake shortcuts: create a link for a demo, or open the answers
  // this customer invitation was built from.
  const sourceIntake = await prisma.intake.findUnique({
    where: { createdInvitationId: row.id },
    select: { id: true },
  });
  const headerActions = (
    <IntakeHeaderActions
      sourceIntakeId={sourceIntake?.id}
      demo={
        row.isDemo && !row.blockedAt
          ? {
              kind: "convite",
              id: row.id,
              name:
                row.landingModelName ||
                buildInvitationDisplayName({
                  eventType: initialData.eventType,
                  primaryName: initialData.couple.bride,
                  secondaryName: initialData.couple.groom,
                }),
            }
          : null
      }
    />
  );

  // The host sees the guestbook in the preview with the messages it would
  // publish, so it can be styled before (or without) going live.
  const guestbookResponses = isMinimalismBrownLayout(row.theme)
    ? await getGuestbookResponses(row.slug)
    : undefined;

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
        themes={themes}
        headerActions={headerActions}
      />
    );
  }

  return (
    <InvitationForm
      mode="edit"
      initialData={initialData}
      invitationId={row.id}
      ownerUrl={ownerUrl}
      themes={themes}
      headerActions={headerActions}
      guestbookResponses={guestbookResponses}
    />
  );
}
