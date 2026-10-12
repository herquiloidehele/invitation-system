import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { IntakeWizard } from "@/components/intake/IntakeWizard";
import { resolveLocale } from "@/i18n/locales";
import { intakeRef } from "@/lib/intake/links";
import { buildIntakeMetadata } from "@/lib/intake/metadata";
import { demoPreviewHref } from "@/lib/intake/page-data";
import { loadIntakeByToken } from "@/lib/intake/service";
import { isIntakeTokenShape } from "@/lib/intake/tokens";
import { SITE_URL } from "@/lib/seo";

// The customer's personal intake link. It keeps working whatever happens to
// the demo afterwards (blocked, renamed, deleted): the answers belong to the
// customer, and the demo name was snapshotted when the intake was created.

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; token: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Intake" });
  return buildIntakeMetadata(
    { title: t("metaTitle"), description: t("metaDescription"), locale },
    SITE_URL,
  );
}

export default async function IntakeTokenPage({ params }: { params: Params }) {
  const { locale: rawLocale, token } = await params;
  const locale = resolveLocale(rawLocale);
  if (!isIntakeTokenShape(token)) notFound();

  const intake = await loadIntakeByToken(token);
  if (!intake) notFound();
  const { row, kind, demo } = intake;

  return (
    <IntakeWizard
      mode="resume"
      kind={kind}
      locale={locale}
      demo={{
        slug: row.demoSlug,
        name: row.demoName,
        imageUrl: demo?.imageUrl ?? null,
        previewHref: demoPreviewHref(kind, row.demoSlug, locale),
        customizable: intake.customizable,
      }}
      token={row.token}
      reference={intakeRef(row.id)}
      initialContact={{ name: row.contactName ?? "" }}
      initialAnswers={intake.answers}
      initialStep={row.lastStep}
      status={row.status}
      submittedAt={row.submittedAt?.toISOString() ?? null}
      defaultEventType={demo?.eventType ?? "wedding"}
    />
  );
}
