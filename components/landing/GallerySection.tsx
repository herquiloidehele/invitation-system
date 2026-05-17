"use client";

import { useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type {
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
} from "@/lib/landing-features";
import { AnimatedSection } from "./AnimatedSection";
import {
  dbCategoryToTab,
  galleryCategories,
  type GalleryCategory,
} from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

type GalleryCard = GalleryFeature & { tab: GalleryCategory };

export function GallerySection({
  activeCategory,
  onCategoryChange,
  itemsByCategory,
}: {
  activeCategory: GalleryCategory;
  onCategoryChange: (category: GalleryCategory) => void;
  itemsByCategory: Record<DbGalleryCategory, GalleryFeature[]>;
}) {
  const allItems = useMemo<GalleryCard[]>(
    () =>
      Object.entries(itemsByCategory).flatMap(([key, list]) =>
        list.map((item) => ({
          ...item,
          tab: dbCategoryToTab[key as DbGalleryCategory],
        })),
      ),
    [itemsByCategory],
  );

  const visibleItems =
    activeCategory === "Todos"
      ? allItems
      : allItems.filter((item) => item.tab === activeCategory);

  return (
    <AnimatedSection id="galeria" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Galeria</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Histórias que inspiram
          </h2>
          <p className="mt-5 text-[#5C605A]">
            Convites reais de casais reais. Cada projecto contado com
            sensibilidade.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {galleryCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4 ${
                activeCategory === category
                  ? "bg-[#3F4E3F] text-white"
                  : "border border-[#E5E7E4] text-[#1F2420] hover:border-[#3F4E3F]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        {visibleItems.length === 0 ? (
          <p className="mt-16 text-center text-sm text-[#5C605A]">
            Ainda sem convites em destaque nesta categoria.
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
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="group overflow-hidden rounded-[1.5rem] border border-[#E5E7E4] bg-white shadow-[0_12px_40px_rgba(31,36,32,0.045)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(31,36,32,0.08)]"
                >
                  <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,#E5E7E4,#C9D0C6)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Convite"}
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(31,36,32,0.16))]" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1F2420]">
                      {item.title || "Convite"}
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
    </AnimatedSection>
  );
}
