"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { GalleryCategory as DbGalleryCategory, GalleryFeature } from "@/lib/landing-features";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedSection } from "./AnimatedSection";
import {
  dbCategoryToTabKey,
  type GalleryCategoryKey,
  getVisibleGalleryCategories,
  groupGalleryByCustomization
} from "./landing-data";
import {
  getMotionProps,
  landingCardTap,
  landingCardVariants,
  landingFastTransition,
  landingStaggerVariants,
  shouldReduceMotion
} from "./landing-motion";
import { LandingModelCard } from "./LandingModelCard";
import { PhoneIframePreview } from "./PhoneIframePreview";

type GalleryCard = GalleryFeature & { tab: GalleryCategoryKey };

export function GallerySection({
  itemsByCategory,
}: {
  itemsByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
}) {
  const t = useTranslations("LandingGallery");
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const [previewItem, setPreviewItem] = useState<GalleryCard | null>(null);
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

  function handleCardClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    item: GalleryCard,
  ) {
    // On mobile, allow the anchor to open the invitation in a new page.
    if (isMobile) return;

    // Respect modifier keys / middle clicks so users can still open in a new tab.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setPreviewItem(item);
  }

  const previewTitle = previewItem?.title || t("fallbackTitle");

  function renderCollection({
    id,
    title,
    description,
    data,
    activeCategory,
    onCategoryChange,
  }: {
    id: string;
    title: string;
    description: string;
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
        <motion.div
          layout
          {...getMotionProps(reduceMotion, landingStaggerVariants)}
          className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {data.visibleItems.map((item) => (
              <LandingModelCard
                key={item.id}
                item={item}
                variant="gallery"
                motionProps={{
                  layout: true,
                  variants: landingCardVariants,
                  initial: reduced ? false : "hidden",
                  animate: reduced ? undefined : "visible",
                  exit: reduced ? undefined : "exit",
                  whileTap: reduced ? undefined : landingCardTap,
                }}
                labels={{
                  fallbackTitle: t("fallbackTitle"),
                  previewAria: t("previewAria"),
                  clickToPreview: t("clickToPreview"),
                  showMore: t("showMore"),
                  showLess: t("showLess"),
                  buyCta: t("buyCta"),
                }}
                onPreviewClick={(event) => handleCardClick(event, item)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    );
  }

  return (
    <AnimatedSection
      id="modelos"
      className="bg-background px-5 py-24 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/*<div className="mx-auto max-w-3xl text-center">*/}
        {/*  <div className="flex justify-center">*/}
        {/*    <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>*/}
        {/*  </div>*/}
        {/*  <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">*/}
        {/*    {t("title")}*/}
        {/*  </h2>*/}
        {/*  <p className="mt-5 text-muted-foreground">{t("body")}</p>*/}
        {/*</div>*/}
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
            data: fullyCustomizable,
            activeCategory: activeFullyCustomizableCategory,
            onCategoryChange: setActiveFullyCustomizableCategory,
          })}
          {renderCollection({
            id: "modelos-predefinidos",
            title: t("preDesigned.title"),
            description: t("preDesigned.description"),
            data: preDesigned,
            activeCategory: activePreDesignedCategory,
            onCategoryChange: setActivePreDesignedCategory,
          })}
        </div>
      </div>

      <DialogPrimitive.Root
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(22rem,calc(100vw-2.5rem))] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <DialogPrimitive.Title className="sr-only">
              {previewTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute -top-10 -right-10 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <XIcon className="h-5 w-5" />
            </DialogPrimitive.Close>
            {previewItem ? (
              <div className="flex flex-col items-center gap-6">
                <div className="w-full">
                  <PhoneIframePreview
                    title={previewTitle}
                    src={previewItem.href}
                    showCaption={false}
                  />
                </div>
              </div>
            ) : null}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AnimatedSection>
  );
}
