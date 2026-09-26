import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import InvitationBlockedPage from "@/components/InvitationBlockedPage";
import { IntakeWizard } from "@/components/intake/IntakeWizard";
import { resolveLocale } from "@/i18n/locales";
import { getInvitationBlock } from "@/lib/invitation-block";
import { parseIntakeKind } from "@/lib/intake/catalog";
import { defaultWhatsappPrefix, demoPreviewHref } from "@/lib/intake/page-data";
import { findDemo } from "@/lib/intake/service";
import { createNoIndexMetadata } from "@/lib/seo";

// Self-start: the customer arrives from "Personalizar" on a landing details
// page. Nothing is stored until the contact step is valid; the wizard then
// creates the intake and continues on its personal /personalizar/<token> URL.

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; kind: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: resolveLocale(locale), namespace: "Intake" });
  return { ...createNoIndexMetadata(), title: t("metaTitle") };
}

export default async function IntakeSelfStartPage({ params }: { params: Params }) {
  const { locale: rawLocale, kind: rawKind, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const kind = parseIntakeKind(rawKind);
  if (!kind) notFound();

  const demo = await findDemo(kind, { slug: decodeURIComponent(slug) });
  if (!demo || !demo.isDemo) notFound();

  if (demo.blocked) {
    const block = await getInvitationBlock(demo.slug);
    return <InvitationBlockedPage reason={block?.reason ?? null} locale={locale} />;
  }

  return (
    <IntakeWizard
      mode="new"
      kind={kind}
      locale={locale}
      demo={{
        slug: demo.slug,
        name: demo.name,
        imageUrl: demo.imageUrl,
        previewHref: demoPreviewHref(kind, demo.slug, locale),
        customizable: demo.customizable,
      }}
      token={null}
      reference={null}
      initialContact={{ name: "", whatsapp: "" }}
      initialAnswers={{}}
      initialStep={null}
      status="draft"
      submittedAt={null}
      defaultPrefix={await defaultWhatsappPrefix()}
      defaultEventType={demo.eventType}
    />
  );
}
