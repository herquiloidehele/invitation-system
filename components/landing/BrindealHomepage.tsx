"use client";

import { FormEvent, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  buildContactMessage,
  buildWhatsappUrl,
  type ContactMessageFields,
} from "@/lib/landing-whatsapp";
import type {
  BestSellerFeature,
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
  HeroFeature,
  LiveDemoFeature,
} from "@/lib/landing-features";
import { BestSellersSection } from "./BestSellersSection";
import { ContactSection } from "./ContactSection";
import { FaqSection } from "./FaqSection";
import { FeaturesSection } from "./FeaturesSection";
import { Footer } from "./Footer";
import { GallerySection } from "./GallerySection";
import { HeroSection } from "./HeroSection";
import { LandingNav } from "./LandingNav";
import { LiveDemoSection } from "./LiveDemoSection";
import { ProcessSection } from "./ProcessSection";
import { type GalleryCategoryKey } from "./landing-data";
import { type Currency } from "@/lib/currency/config";

export function BrindealHomepage({
  heroFeature,
  galleryByCategory,
  liveDemoFeatures,
  bestSellerFeatures,
  currentCurrency,
}: {
  heroFeature: HeroFeature | null;
  galleryByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
  liveDemoFeatures: LiveDemoFeature[];
  bestSellerFeatures: BestSellerFeature[];
  currentCurrency: Currency;
}) {
  const reduceMotion = useReducedMotion();
  const landingT = useTranslations("Landing");
  const whatsappT = useTranslations("Whatsapp");
  const [activeGalleryCategory, setActiveGalleryCategory] =
    useState<GalleryCategoryKey>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [formState, setFormState] = useState<ContactMessageFields>({
    name: "",
    eventType: "",
    message: "",
  });

  function updateFormField(field: keyof ContactMessageFields, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.open(
      buildWhatsappUrl(
        buildContactMessage({
          fields: formState,
          intro: landingT("defaultWhatsappMessage"),
          labels: {
            name: whatsappT("name"),
            eventType: whatsappT("eventType"),
            message: whatsappT("message"),
          },
        }),
      ),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="overflow-hidden bg-background font-[var(--font-outfit)] text-foreground">
      <LandingNav currentCurrency={currentCurrency} />
      <HeroSection reduceMotion={reduceMotion} feature={heroFeature} />
      <BestSellersSection items={bestSellerFeatures} />
      <GallerySection
        activeCategory={activeGalleryCategory}
        onCategoryChange={setActiveGalleryCategory}
        itemsByCategory={galleryByCategory}
      />
      <ProcessSection />
      <FeaturesSection />
      <LiveDemoSection items={liveDemoFeatures} />
      <FaqSection
        openIndex={openFaqIndex}
        setOpenIndex={setOpenFaqIndex}
        currentCurrency={currentCurrency}
      />
      <ContactSection
        formState={formState}
        onFieldChange={updateFormField}
        onSubmit={handleContactSubmit}
      />
      <Footer />
    </main>
  );
}
