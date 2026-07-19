import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BrindealHomepage } from "@/components/landing/BrindealHomepage";
import { InstagramBrowserRedirect } from "@/components/landing/InstagramBrowserRedirect";
import { getFaqs } from "@/components/landing/landing-data";
import {
  getBestSellerFeatures,
  getGalleryFeaturesByCategory,
  getHeroFeature,
  getLiveDemoFeatures,
} from "@/lib/landing-features";
import { getLandingGallerySettings } from "@/lib/landing-gallery-settings-data";
import { resolveLocale } from "@/i18n/locales";
import { getViewerCurrency } from "@/lib/currency/viewer-currency";
import { formatUrgencySurcharge } from "@/lib/currency/urgency";
import {
  SITE_URL,
  buildFaqJsonLd,
  buildOrganizationJsonLd,
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildLocalePath,
  buildServiceJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations("Metadata");
  const title = t("homeTitle");
  const description = t("homeDescription");
  const path = buildLocalePath("/", locale);
  const url = buildAbsoluteUrl(SITE_URL, path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(SITE_URL, "/"),
    },
    openGraph: {
      title,
      description,
      url,
      locale,
      type: "website",
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const viewerCurrency = await getViewerCurrency();
  const [
    heroFeature,
    galleryByCategory,
    liveDemoFeatures,
    bestSellerFeatures,
    gallerySettings,
    faqT,
  ] = await Promise.all([
    getHeroFeature(),
    getGalleryFeaturesByCategory(viewerCurrency, locale),
    getLiveDemoFeatures(),
    getBestSellerFeatures(viewerCurrency, locale),
    getLandingGallerySettings(),
    getTranslations("LandingFaq"),
  ]);
  const jsonLd = [
    buildOrganizationJsonLd(SITE_URL),
    buildWebSiteJsonLd(SITE_URL),
    buildServiceJsonLd(SITE_URL),
    buildFaqJsonLd(getFaqs(faqT, formatUrgencySurcharge(viewerCurrency))),
  ];

  return (
    <>
      {jsonLd.map((item) => (
        <script
          key={item["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <BrindealHomepage
        heroFeature={heroFeature}
        galleryByCategory={galleryByCategory}
        liveDemoFeatures={liveDemoFeatures}
        bestSellerFeatures={bestSellerFeatures}
        gallerySettings={gallerySettings}
        currentCurrency={viewerCurrency}
      />
      <InstagramBrowserRedirect />
    </>
  );
}
