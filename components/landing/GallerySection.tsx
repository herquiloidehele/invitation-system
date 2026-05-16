"use client";

import { AnimatePresence, motion } from "framer-motion";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import {
  galleryCategories,
  type GalleryCategory,
  type GalleryItem,
} from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

export function GallerySection({
  activeCategory,
  onCategoryChange,
  items,
}: {
  activeCategory: GalleryCategory;
  onCategoryChange: (category: GalleryCategory) => void;
  items: GalleryItem[];
}) {
  return (
    <AnimatedSection id="galeria" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <SectionEyebrow>Galeria</SectionEyebrow>
            <h2 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
              Histórias que inspiram
            </h2>
            <p className="mt-5 max-w-3xl text-[#5C605A]">
              Convites reais de casais reais. Cada projecto contado com
              sensibilidade.
            </p>
          </div>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-full border border-[#E5E7E4] px-6 py-3 text-sm font-semibold transition hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Ver tudo →
          </a>
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
        <motion.div layout className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.article
                key={item.title}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="group overflow-hidden rounded-[1.5rem] border border-[#E5E7E4] bg-white shadow-[0_12px_40px_rgba(31,36,32,0.045)]"
              >
                <div className={`relative h-72 overflow-hidden ${item.gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.42),transparent_22%),linear-gradient(to_bottom,transparent_55%,rgba(31,36,32,0.16))] transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-[#3F4E3F] shadow-sm">
                    {item.category === "Casamentos"
                      ? "Casamento"
                      : item.category === "Save the Date"
                        ? "Save the Date"
                        : item.category === "Aniversários"
                          ? "Aniversário"
                          : item.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#1F2420]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#5C605A]">
                    {item.date} · {item.location}
                  </p>
                  <p className="mt-2 text-base font-bold text-[#3F4E3F]">
                    {item.price}
                  </p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
