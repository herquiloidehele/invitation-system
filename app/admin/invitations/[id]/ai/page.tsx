import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { getThemes } from "@/lib/themes";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitationForm from "../../InvitationForm";
import AiBuilderConsole from "./AiBuilderConsole";

export const dynamic = "force-dynamic";

export default async function AiInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, themes] = await Promise.all([
    prisma.invitation.findUnique({ where: { id }, include: { theme: true } }),
    getThemes(),
  ]);
  if (!row) notFound();

  const couple = row.couple as { bride?: string; groom?: string } | null;
  const title =
    couple?.bride && couple?.groom
      ? `${couple.bride} & ${couple.groom}`
      : row.slug;
  const locale = row.enabledLocales?.[0] ?? "pt";

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const ownerUrl = `${proto}://${host}/confirmacoes/${row.ownerToken}`;

  const initialData = toAdminInvitationInitialData(row);

  return (
    <Tabs defaultValue="builder" className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="builder" className="mt-0">
        <AiBuilderConsole slug={row.slug} locale={locale} />
      </TabsContent>

      <TabsContent value="settings" className="mt-0">
        <InvitationForm
          mode="edit"
          variant="ai"
          initialData={initialData}
          invitationId={row.id}
          ownerUrl={ownerUrl}
          themes={themes}
        />
      </TabsContent>
    </Tabs>
  );
}
