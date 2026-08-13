"use client";

import { useTranslations } from "next-intl";
import type { BestSellerFeature } from "@/lib/landing-features";
import { AnimatedSection } from "./AnimatedSection";
import { LandingModelCard } from "./LandingModelCard";
import {
  ModelCarousel,
  MODEL_CAROUSEL_SLIDE_CLASS_NAME,
} from "./ModelCarousel";

export function BestSellersSection({ items }: { items: BestSellerFeature[] }) {
  const t = useTranslations("LandingBestSellers");

  return (
    <AnimatedSection id="destaques" className="bg-muted px-5 py-14 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-muted-foreground">{t("body")}</p>
        </div>

        {items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-14">
            <ModelCarousel
              items={items}
              label={t("title")}
              contentClassName="gap-4 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3"
              renderItem={(item, { isMobile }) => (
                <LandingModelCard
                  key={item.id}
                  item={item}
                  variant="bestSeller"
                  className={MODEL_CAROUSEL_SLIDE_CLASS_NAME}
                  motionProps={{
                    layout: isMobile ? undefined : true,
                    initial: { opacity: 0, scale: 0.96 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.96 },
                  }}
                  labels={{
                    fallbackTitle: t("fallbackTitle"),
                    viewDetails: t("viewDetails"),
                    showMore: t("showMore"),
                    showLess: t("showLess"),
                    buyCta: t("buyCta"),
                  }}
                />
              )}
            />
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
