"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LiveDemoFeature } from "@/lib/landing-features";
import { AnimatedSection } from "./AnimatedSection";
import {
  getMotionProps,
  landingCardVariants,
  landingStaggerVariants,
} from "./landing-motion";
import { PhoneIframePreview } from "./PhoneIframePreview";
import { SectionEyebrow } from "./SectionEyebrow";

const FALLBACK: LiveDemoFeature[] = [
  { id: "fallback-1", title: "Leonor & Diogo", href: "/leonor-diogo" },
  { id: "fallback-2", title: "Sofia & Pedro", href: "/sofia-pedro" },
];

export function LiveDemoSection({ items }: { items: LiveDemoFeature[] }) {
  const t = useTranslations("LandingLiveDemo");
  const reduceMotion = useReducedMotion();
  const previews = items.length > 0 ? items.slice(0, 2) : FALLBACK;

  return (
    <AnimatedSection className="bg-muted px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-muted-foreground">
            {t("body")}
          </p>
        </div>
        <motion.div
          {...getMotionProps(reduceMotion, landingStaggerVariants)}
          className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16"
        >
          {previews.map((preview) => (
            <motion.div key={preview.id} variants={landingCardVariants}>
              <PhoneIframePreview
                title={preview.title || t("fallbackInvitation")}
                src={preview.href}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
