"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { BestSellerFeature } from "@/lib/landing-features";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedSection } from "./AnimatedSection";
import { LandingModelCard } from "./LandingModelCard";
import { PhoneIframePreview } from "./PhoneIframePreview";
import { SectionEyebrow } from "./SectionEyebrow";

export function BestSellersSection({ items }: { items: BestSellerFeature[] }) {
  const t = useTranslations("LandingBestSellers");
  const isMobile = useIsMobile();
  const [previewItem, setPreviewItem] = useState<BestSellerFeature | null>(
    null,
  );

  function handleCardClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    item: BestSellerFeature,
  ) {
    if (isMobile) return;
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
    <AnimatedSection id="destaques" className="bg-muted px-5 py-24 sm:px-8">
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

        {items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <motion.div layout className="mt-14 grid gap-5 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const featured = index === 1;
                const indexLabel = String(index + 1).padStart(2, "0");
                return (
                  <LandingModelCard
                    key={item.id}
                    item={item}
                    variant={featured ? "featuredBestSeller" : "bestSeller"}
                    motionProps={{
                      layout: true,
                      initial: { opacity: 0, scale: 0.96 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0, scale: 0.96 },
                    }}
                    badgeLabel={`${indexLabel} · ${t("badge")}`}
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
                );
              })}
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
