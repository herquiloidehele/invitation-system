import { prisma } from "@/lib/db";
import { isIntakeUnseen } from "@/lib/intake/answers";
import { intakeRef } from "@/lib/intake/links";
import { listDemos } from "@/lib/intake/service";
import { IntakesClient } from "./IntakesClient";

export const dynamic = "force-dynamic";

export type IntakeListRow = {
  id: string;
  reference: string;
  productKind: string;
  demoName: string;
  source: string;
  status: string;
  contactName: string | null;
  contactWhatsapp: string | null;
  lastActivity: string;
  unseen: boolean;
};

export default async function AdminIntakesPage() {
  const [intakes, demos] = await Promise.all([
    prisma.intake.findMany({
      orderBy: { updatedAt: "desc" },
      take: 500,
      select: {
        id: true,
        productKind: true,
        demoName: true,
        source: true,
        status: true,
        contactName: true,
        contactWhatsapp: true,
        createdAt: true,
        answersUpdatedAt: true,
        adminViewedAt: true,
      },
    }),
    listDemos(),
  ]);

  const rows: IntakeListRow[] = intakes.map((intake) => ({
    id: intake.id,
    reference: intakeRef(intake.id),
    productKind: intake.productKind,
    demoName: intake.demoName,
    source: intake.source,
    status: intake.status,
    contactName: intake.contactName,
    contactWhatsapp: intake.contactWhatsapp,
    lastActivity: (intake.answersUpdatedAt ?? intake.createdAt).toISOString(),
    unseen: isIntakeUnseen(intake),
  }));

  return (
    <IntakesClient
      rows={rows}
      demos={demos
        .filter((demo) => !demo.blocked)
        .map((demo) => ({ kind: demo.kind, id: demo.id, name: demo.name }))}
    />
  );
}
