"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type {
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
} from "@/lib/landing-features";
import { AnimatedSection } from "./AnimatedSection";
import {
  dbCategoryToTabKey,
  type GalleryCategoryKey,
  getVisibleGalleryCategories,
  groupGalleryByCustomization,
} from "./landing-data";
import {
  landingCardTap,
  landingCardVariants,
  landingFastTransition,
  shouldReduceMotion,
} from "./landing-motion";
import { LandingModelCard } from "./LandingModelCard";
import {
  ModelCarousel,
  MODEL_CAROUSEL_SLIDE_CLASS_NAME,
} from "./ModelCarousel";
import { GalleryFeatureList } from "./GalleryFeatureList";
import {
  getFeaturesForCustomizationLevel,
  type LandingGallerySettings,
} from "@/lib/landing-gallery-settings";

export function GallerySection({
  itemsByCategory,
  settings,
}: {
  itemsByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
  settings: LandingGallerySettings;
}) {
  const t = useTranslations("LandingGallery");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const [activeFullyCustomizableCategory, setActiveFullyCustomizableCategory] =
    useState<GalleryCategoryKey>("all");
  const [activePreDesignedCategory, setActivePreDesignedCategory] =
    useState<GalleryCategoryKey>("all");
  const groups = useMemo(
    () => groupGalleryByCustomization(itemsByCategory),
    [itemsByCategory],
  );

  function collectionData(
    groupItems: Record<DbGalleryCategory, GalleryFeature[]>,
    activeCategory: GalleryCategoryKey,
  ) {
    const categories = getVisibleGalleryCategories(t, groupItems);
    const allItems = Object.entries(groupItems).flatMap(([key, list]) =>
      list.map((item) => ({
        ...item,
        tab: dbCategoryToTabKey[key as DbGalleryCategory],
      })),
    );
    const hasActiveCategory = categories.some(
      (category) => category.key === activeCategory,
    );
    const visibleItems =
      activeCategory === "all" || !hasActiveCategory
        ? allItems
        : allItems.filter((item) => item.tab === activeCategory);
    return { categories, allItems, visibleItems };
  }

  const fullyCustomizable = collectionData(
    groups.fullyCustomizable,
    activeFullyCustomizableCategory,
  );
  const preDesigned = collectionData(
    groups.preDesigned,
    activePreDesignedCategory,
  );

  function renderCollection({
    id,
    title,
    description,
    features,
    data,
    activeCategory,
    onCategoryChange,
  }: {
    id: string;
    title: string;
    description: string;
    features: string[];
    data: ReturnType<typeof collectionData>;
    activeCategory: GalleryCategoryKey;
    onCategoryChange: (category: GalleryCategoryKey) => void;
  }) {
    if (data.allItems.length === 0) return null;

    return (
      <section id={id} className="scroll-mt-24 pt-20 first:pt-0">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-medium tracking-[-0.025em] sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
          <GalleryFeatureList features={features} />
        </div>
        {data.categories.length > 0 ? (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {data.categories.map((category) => (
              <motion.button
                key={category.key}
                type="button"
                onClick={() => onCategoryChange(category.key)}
                animate={
                  reduced
                    ? undefined
                    : { scale: activeCategory === category.key ? 1.03 : 1 }
                }
                whileHover={reduced ? undefined : { y: -1 }}
                whileTap={reduced ? undefined : landingCardTap}
                transition={landingFastTransition}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4 ${
                  activeCategory === category.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:border-primary"
                }`}
              >
                {category.label}
              </motion.button>
            ))}
          </div>
        ) : null}
        <div className="mt-10">
          <ModelCarousel
            items={data.visibleItems}
            label={title}
            resetKey={activeCategory}
            animateOnMount={false}
            contentClassName="gap-3 md:grid md:grid-cols-2 lg:grid-cols-3"
            renderItem={(item, { isMobile }) => (
              <LandingModelCard
                key={item.id}
                item={item}
                variant="gallery"
                className={MODEL_CAROUSEL_SLIDE_CLASS_NAME}
                motionProps={{
                  layout: isMobile ? undefined : true,
                  variants: landingCardVariants,
                  initial: reduced ? false : "hidden",
                  animate: reduced ? undefined : "visible",
                  exit: reduced ? undefined : "exit",
                  whileTap: reduced ? undefined : landingCardTap,
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
      </section>
    );
  }

  return (
    <AnimatedSection
      id="modelos"
      className="bg-background px-5 py-24 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header content is rendered per customization collection below. */}
        {fullyCustomizable.allItems.length === 0 &&
        preDesigned.allItems.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : null}
        <div className="mt-14">
          {renderCollection({
            id: "modelos-personalizaveis",
            title: t("fullyCustomizable.title"),
            description: t("fullyCustomizable.description"),
            features: getFeaturesForCustomizationLevel(
              settings,
              "fully_customizable",
            ),
            data: fullyCustomizable,
            activeCategory: activeFullyCustomizableCategory,
            onCategoryChange: setActiveFullyCustomizableCategory,
          })}
          {renderCollection({
            id: "modelos-predefinidos",
            title: t("preDesigned.title"),
            description: t("preDesigned.description"),
            features: getFeaturesForCustomizationLevel(
              settings,
              "pre_designed",
            ),
            data: preDesigned,
            activeCategory: activePreDesignedCategory,
            onCategoryChange: setActivePreDesignedCategory,
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}
