import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BrindealHomepage } from "@/components/landing/BrindealHomepage";
import {
  getGalleryFeaturesByCategory,
  getHeroFeature,
  getLiveDemoFeatures,
} from "@/lib/landing-features";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

export default async function Home() {
  const [heroFeature, galleryByCategory, liveDemoFeatures] = await Promise.all([
    getHeroFeature(),
    getGalleryFeaturesByCategory(),
    getLiveDemoFeatures(),
  ]);

  return (
    <BrindealHomepage
      heroFeature={heroFeature}
      galleryByCategory={galleryByCategory}
      liveDemoFeatures={liveDemoFeatures}
    />
  );
}
