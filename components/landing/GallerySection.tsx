"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type {
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
} from "@/lib/landing-features";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MousePointerClickIcon, XIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedSection } from "./AnimatedSection";
import { ExpandableDescription } from "./ExpandableDescription";
import {
  dbCategoryToTabKey,
  type GalleryCategoryKey,
  getVisibleGalleryCategories,
} from "./landing-data";
import {
  getMotionProps,
  landingCardHover,
  landingCardTap,
  landingCardVariants,
  landingFastTransition,
  landingStaggerVariants,
  shouldReduceMotion,
} from "./landing-motion";
import { PhoneIframePreview } from "./PhoneIframePreview";
import { SectionEyebrow } from "./SectionEyebrow";

type GalleryCard = GalleryFeature & { tab: GalleryCategoryKey };

export function GallerySection({
  activeCategory,
  onCategoryChange,
  itemsByCategory,
}: {
  activeCategory: GalleryCategoryKey;
  onCategoryChange: (category: GalleryCategoryKey) => void;
  itemsByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
}) {
  const t = useTranslations("LandingGallery");
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const [previewItem, setPreviewItem] = useState<GalleryCard | null>(null);
  const galleryCategories = getVisibleGalleryCategories(t, itemsByCategory);
  const allItems = useMemo<GalleryCard[]>(
    () =>
      Object.entries(itemsByCategory).flatMap(([key, list]) =>
        list.map((item) => ({
          ...item,
          tab: dbCategoryToTabKey[key as DbGalleryCategory],
        })),
      ),
    [itemsByCategory],
  );

  const hasActiveCategory = galleryCategories.some(
    (category) => category.key === activeCategory,
  );
  const visibleItems =
    activeCategory === "all" || !hasActiveCategory
      ? allItems
      : allItems.filter((item) => item.tab === activeCategory);

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

  return (
    <AnimatedSection
      id="modelos"
      className="bg-background px-5 py-24 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-muted-foreground">{t("body")}</p>
        </div>
        {galleryCategories.length > 0 ? (
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {galleryCategories.map((category) => (
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
        {visibleItems.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <motion.div
            layout
            {...getMotionProps(reduceMotion, landingStaggerVariants)}
            className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleItems.map((item) => (
                <motion.a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t("previewAria")}: ${item.title || t("fallbackTitle")}`}
                  onClick={(event) => handleCardClick(event, item)}
                  layout
                  variants={landingCardVariants}
                  initial={reduced ? false : "hidden"}
                  animate={reduced ? undefined : "visible"}
                  exit={reduced ? undefined : "exit"}
                  whileHover={reduced ? undefined : landingCardHover}
                  whileTap={reduced ? undefined : landingCardTap}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_4.5%,transparent)] transition hover:shadow-[0_20px_60px_color-mix(in_srgb,var(--foreground)_8%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                >
                  <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,var(--border),var(--primary-soft))]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title || t("fallbackTitle")}
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,color-mix(in_srgb,var(--foreground)_16%,transparent))]" />
                    <div className="pointer-events-none absolute top-3 right-3 z-10 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute h-full w-full motion-safe:animate-ping rounded-full bg-foreground/20" />
                        <div className="relative motion-safe:animate-pulso rounded-full bg-background/90 p-2.5 shadow-lg backdrop-blur-sm">
                          <MousePointerClickIcon className="h-4 w-4 text-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                      {item.title || t("fallbackTitle")}
                    </h3>
                    {item.description ? (
                      <ExpandableDescription
                        text={item.description}
                        className="mt-2 text-sm leading-5 text-muted-foreground"
                        toggleClassName="text-foreground"
                        moreLabel={t("showMore")}
                        lessLabel={t("showLess")}
                      />
                    ) : null}
                    {item.price ? (
                      <div className="mt-auto flex items-baseline gap-2 pt-2">
                        {item.price.originalLabel ? (
                          <span className="text-xs text-subtle-foreground/60 line-through">
                            {item.price.originalLabel}
                          </span>
                        ) : null}
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            {item.price.prefix}
                          </span>
                          <span className="text-base font-semibold text-foreground">
                            {item.price.amount}
                          </span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
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
