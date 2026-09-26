import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { resolveLocale } from "@/i18n/locales";
import {
  getInvitationEditPath,
  getSaveTheDateEditPath,
} from "@/lib/admin-row-navigation";
import {
  changedKeysSince,
  formatIntakeAnswers,
  intakeAnswersToText,
} from "@/lib/intake/answers";
import { originFromHeaders } from "@/lib/intake/http";
import { buildIntakeUrl, intakeRef } from "@/lib/intake/links";
import { loadIntakeById } from "@/lib/intake/service";
import { IntakeDetailClient } from "./IntakeDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminIntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const intake = await loadIntakeById(id);
  if (!intake) notFound();

  const { row, kind, answers, demo, customizable } = intake;
  const changed = changedKeysSince(row.answers, row.adminViewedAt);
  const sections = formatIntakeAnswers(kind, answers, { customizable }).map(
    (section) => ({
      ...section,
      rows: section.rows.map((item) => ({
        ...item,
        changed: changed.has(item.key),
      })),
    }),
  );
  const contact = {
    name: row.contactName ?? "",
    whatsapp: row.contactWhatsapp ?? "",
  };

  const createdHref = row.createdInvitationId
    ? getInvitationEditPath(row.createdInvitationId)
    : row.createdSaveTheDateId
      ? getSaveTheDateEditPath(row.createdSaveTheDateId)
      : null;

  return (
    <IntakeDetailClient
      intake={{
        id: row.id,
        reference: intakeRef(row.id),
        kind,
        status: row.status,
        source: row.source,
        demoName: row.demoName,
        demoSlug: row.demoSlug,
        demoExists: demo !== null,
        demoImageUrl: demo?.imageUrl ?? null,
        contactName: contact.name,
        contactWhatsapp: contact.whatsapp,
        createdAt: row.createdAt.toISOString(),
        submittedAt: row.submittedAt?.toISOString() ?? null,
        answersUpdatedAt: row.answersUpdatedAt?.toISOString() ?? null,
        url: buildIntakeUrl(
          originFromHeaders(await headers()),
          row.token,
          resolveLocale(row.locale),
        ),
        createdHref,
      }}
      sections={sections}
      plainText={intakeAnswersToText({
        kind,
        demoName: row.demoName,
        contact,
        answers,
        customizable,
      })}
    />
  );
}
