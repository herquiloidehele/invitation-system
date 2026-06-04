"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { BestSellerFeature } from "@/lib/landing-features";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedSection } from "./AnimatedSection";
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
    <AnimatedSection
      id="destaques"
      className="bg-muted px-5 py-24 sm:px-8"
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
                    whileHover={{ y: -8 }}
                    className={`group block cursor-pointer overflow-hidden rounded-[1.5rem] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 ${
                      featured
                        ? "bg-primary text-primary-foreground shadow-[0_24px_80px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                        : "border border-border bg-card text-foreground shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:shadow-[0_20px_60px_color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                    }`}
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
                      <span
                        className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${
                          featured
                            ? "bg-white/20 text-white backdrop-blur"
                            : "bg-background/95 text-primary"
                        }`}
                      >
                        {indexLabel} · {t("badge")}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold tracking-[-0.02em]">
                        {item.title || t("fallbackTitle")}
                      </h3>
                      {item.description ? (
                        <p
                          className={`mt-3 text-sm leading-6 ${
                            featured ? "text-primary-soft" : "text-muted-foreground"
                          }`}
                        >
                          {item.description}
                        </p>
                      ) : null}
                      {item.priceLabel ? (
                        <p
                          className={`mt-3 text-sm font-medium ${
                            featured ? "text-primary-foreground/80" : "text-subtle-foreground"
                          }`}
                        >
                          {item.priceLabel}
                        </p>
                      ) : null}
                    </div>
                  </motion.a>
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
