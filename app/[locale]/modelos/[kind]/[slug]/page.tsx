import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { LandingProductDetailsPage } from "@/components/landing/details/LandingProductDetailsPage";
import { resolveLocale } from "@/i18n/locales";
import { getViewerCurrency } from "@/lib/currency/viewer-currency";
import { getLandingProductDetails } from "@/lib/landing-product-details-data";
import { parseLandingProductKind } from "@/lib/landing-product-details";
import {
  SITE_URL,
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildLocalePath,
  createPublicPageRobotsMetadata,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ locale: string; kind: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale: rawLocale, kind: rawKind, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const kind = parseLandingProductKind(rawKind);
  const metadataT = await getTranslations("Metadata");

  if (!kind) return { title: metadataT("invitationNotFound") };

  const viewerCurrency = await getViewerCurrency();
  const details = await getLandingProductDetails(
    kind,
    slug,
    viewerCurrency,
    locale,
  );
  if (!details) {
    return {
      title:
        kind === "save-the-date"
          ? metadataT("saveTheDateNotFound")
          : metadataT("invitationNotFound"),
    };
  }

  const canonicalPath = buildLocalePath(details.detailsHref, locale);
  const canonical = buildAbsoluteUrl(SITE_URL, canonicalPath);
  const image = details.images[0];

  return {
    title: details.title,
    description: details.description ?? undefined,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(SITE_URL, details.detailsHref),
    },
    robots: createPublicPageRobotsMetadata(true),
    openGraph: {
      title: details.title,
      description: details.description ?? undefined,
      url: canonical,
      locale,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: details.title,
      description: details.description ?? undefined,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function LandingProductDetailsRoute({
  params,
}: {
  params: PageParams;
}) {
  const { locale: rawLocale, kind: rawKind, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const kind = parseLandingProductKind(rawKind);
  if (!kind) notFound();

  const viewerCurrency = await getViewerCurrency();
  const details = await getLandingProductDetails(
    kind,
    slug,
    viewerCurrency,
    locale,
  );
  if (!details) notFound();

  return (
    <LandingProductDetailsPage
      details={details}
      currentCurrency={viewerCurrency}
      modelsHref={`${buildLocalePath("/", locale)}#modelos`}
    />
  );
}
