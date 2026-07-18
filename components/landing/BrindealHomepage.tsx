"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import type {
  BestSellerFeature,
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
  HeroFeature,
  LiveDemoFeature
} from "@/lib/landing-features";
import { BestSellersSection } from "./BestSellersSection";
import { CustomInvitationSection } from "./CustomInvitationSection";
import { FaqSection } from "./FaqSection";
import { FeaturesSection } from "./FeaturesSection";
import { Footer } from "./Footer";
import { GallerySection } from "./GallerySection";
import { HeroSection } from "./HeroSection";
import { InvitationConstellationSection } from "./InvitationConstellationSection";
import { LandingNav } from "./LandingNav";
import { ProcessSection } from "./ProcessSection";
import { getConstellationPreview } from "./landing-constellation-data";
import { type Currency } from "@/lib/currency/config";
import type { LandingGallerySettings } from "@/lib/landing-gallery-settings";

export function BrindealHomepage({
  heroFeature,
  galleryByCategory,
  liveDemoFeatures,
  bestSellerFeatures,
  gallerySettings,
  currentCurrency,
}: {
  heroFeature: HeroFeature | null;
  galleryByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
  liveDemoFeatures: LiveDemoFeature[];
  bestSellerFeatures: BestSellerFeature[];
  gallerySettings: LandingGallerySettings;
  currentCurrency: Currency;
}) {
  const reduceMotion = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <main className="overflow-hidden bg-background font-[var(--font-outfit)] text-foreground">
      <LandingNav currentCurrency={currentCurrency} />
      <HeroSection reduceMotion={reduceMotion} feature={heroFeature} />
      <BestSellersSection items={bestSellerFeatures} />
      <GallerySection
        itemsByCategory={galleryByCategory}
        settings={gallerySettings}
      />
      <CustomInvitationSection currentCurrency={currentCurrency} />
      <ProcessSection />
      <FeaturesSection />
      <InvitationConstellationSection
        preview={getConstellationPreview(liveDemoFeatures)}
      />
      <FaqSection
        openIndex={openFaqIndex}
        setOpenIndex={setOpenFaqIndex}
        currentCurrency={currentCurrency}
      />
      <Footer />
    </main>
  );
}
