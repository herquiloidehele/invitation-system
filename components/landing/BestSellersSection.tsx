"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { BestSellerFeature } from "@/lib/landing-features";
import { AnimatedSection } from "./AnimatedSection";
import { LandingModelCard } from "./LandingModelCard";

export function BestSellersSection({ items }: { items: BestSellerFeature[] }) {
  const t = useTranslations("LandingBestSellers");

  return (
    <AnimatedSection id="destaques" className="bg-muted px-5 py-24 sm:px-8">
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
          <motion.div layout className="mt-14 grid gap-5 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const featured = index === 1;
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
                    labels={{
                      fallbackTitle: t("fallbackTitle"),
                      viewDetails: t("viewDetails"),
                      showMore: t("showMore"),
                      showLess: t("showLess"),
                      buyCta: t("buyCta"),
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </AnimatedSection>
  );
}
