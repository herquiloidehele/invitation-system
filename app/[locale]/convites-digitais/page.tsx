import type { Metadata } from "next";

import { SeoServicePage } from "@/components/landing/SeoServicePage";
import { buildServicePageMetadata } from "@/lib/seo-service-pages";

const slug = "convites-digitais";

export function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return params.then(({ locale }) => buildServicePageMetadata(slug, locale));
}

export default async function ConvitesDigitaisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SeoServicePage slug={slug} locale={locale} />;
}
