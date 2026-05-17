import { BrindealHomepage } from "@/components/landing/BrindealHomepage";
import {
  getGalleryFeaturesByCategory,
  getHeroFeature,
  getLiveDemoFeatures,
} from "@/lib/landing-features";

export const dynamic = "force-dynamic";

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
