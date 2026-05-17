"use client";

import { FormEvent, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  buildContactMessage,
  buildWhatsappUrl,
  type ContactMessageFields,
} from "@/lib/landing-whatsapp";
import type {
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
  HeroFeature,
  LiveDemoFeature,
} from "@/lib/landing-features";
import { ContactSection } from "./ContactSection";
import { FaqSection } from "./FaqSection";
import { FeaturesSection } from "./FeaturesSection";
import { Footer } from "./Footer";
import { GallerySection } from "./GallerySection";
import { HeroSection } from "./HeroSection";
import { LandingNav } from "./LandingNav";
import { LiveDemoSection } from "./LiveDemoSection";
import { ProcessSection } from "./ProcessSection";
import { TypesSection } from "./TypesSection";
import { type GalleryCategory } from "./landing-data";

export function BrindealHomepage({
  heroFeature,
  galleryByCategory,
  liveDemoFeatures,
}: {
  heroFeature: HeroFeature | null;
  galleryByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
  liveDemoFeatures: LiveDemoFeature[];
}) {
  const reduceMotion = useReducedMotion();
  const [activeGalleryCategory, setActiveGalleryCategory] =
    useState<GalleryCategory>("Todos");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [formState, setFormState] = useState<ContactMessageFields>({
    name: "",
    eventType: "",
    date: "",
    guests: "",
    message: "",
  });

  function updateFormField(field: keyof ContactMessageFields, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.open(
      buildWhatsappUrl(buildContactMessage(formState)),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="overflow-hidden bg-white font-[var(--font-outfit)] text-[#1F2420]">
      <LandingNav />
      <HeroSection reduceMotion={reduceMotion} feature={heroFeature} />
      <TypesSection />
      <GallerySection
        activeCategory={activeGalleryCategory}
        onCategoryChange={setActiveGalleryCategory}
        itemsByCategory={galleryByCategory}
      />
      <ProcessSection />
      <FeaturesSection />
      <LiveDemoSection items={liveDemoFeatures} />
      <FaqSection openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} />
      <ContactSection
        formState={formState}
        onFieldChange={updateFormField}
        onSubmit={handleContactSubmit}
      />
      <Footer />
    </main>
  );
}
