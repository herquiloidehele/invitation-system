"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { GalleryCategory as DbGalleryCategory, GalleryFeature } from "@/lib/landing-features";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedSection } from "./AnimatedSection";
import { dbCategoryToTabKey, type GalleryCategoryKey, getGalleryCategories } from "./landing-data";
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
  const [previewItem, setPreviewItem] = useState<GalleryCard | null>(null);
  const galleryCategories = getGalleryCategories(t);
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

  const visibleItems =
    activeCategory === "all"
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
      id="galeria"
      className="bg-white px-5 py-24 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-[#5C605A]">{t("body")}</p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {galleryCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => onCategoryChange(category.key)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4 ${
                activeCategory === category.key
                  ? "bg-[#3F4E3F] text-white"
                  : "border border-[#E5E7E4] text-[#1F2420] hover:border-[#3F4E3F]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        {visibleItems.length === 0 ? (
          <p className="mt-16 text-center text-sm text-[#5C605A]">
            {t("empty")}
          </p>
        ) : (
          <motion.div
            layout
            className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item) => (
                <motion.a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t("previewAria")}: ${item.title || t("fallbackTitle")}`}
                  onClick={(event) => handleCardClick(event, item)}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-[#E5E7E4] bg-white shadow-[0_12px_40px_rgba(31,36,32,0.045)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(31,36,32,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3F4E3F] focus-visible:ring-offset-4"
                >
                  <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,#E5E7E4,#C9D0C6)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title || t("fallbackTitle")}
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(31,36,32,0.16))]" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1F2420]">
                      {item.title || t("fallbackTitle")}
                    </h3>
                    {item.subtitle ? (
                      <p className="mt-1.5 text-xs text-[#5C605A]">
                        {item.subtitle}
                      </p>
                    ) : null}
                    {item.priceLabel ? (
                      <p className="mt-2 text-xs font-medium text-[#8A8E86]">
                        {item.priceLabel}
                      </p>
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
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#0D1510]/70 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(22rem,calc(100vw-2.5rem))] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <DialogPrimitive.Title className="sr-only">
              {previewTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute -top-10 -right-10 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#1F2420] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
