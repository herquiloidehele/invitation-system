import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BrindealHomepage } from "@/components/landing/BrindealHomepage";
import { getFaqs } from "@/components/landing/landing-data";
import {
  getBestSellerFeatures,
  getGalleryFeaturesByCategory,
  getHeroFeature,
  getLiveDemoFeatures,
} from "@/lib/landing-features";
import { resolveLocale } from "@/i18n/locales";
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

export default async function Home() {
  const [
    heroFeature,
    galleryByCategory,
    liveDemoFeatures,
    bestSellerFeatures,
    faqT,
  ] = await Promise.all([
    getHeroFeature(),
    getGalleryFeaturesByCategory(),
    getLiveDemoFeatures(),
    getBestSellerFeatures(),
    getTranslations("LandingFaq"),
  ]);
  const jsonLd = [
    buildOrganizationJsonLd(SITE_URL),
    buildWebSiteJsonLd(SITE_URL),
    buildServiceJsonLd(SITE_URL),
    buildFaqJsonLd(getFaqs(faqT)),
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
      />
    </>
  );
}
