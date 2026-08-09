"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ProductLightbox } from "./ProductLightbox";

export function ProductMediaGallery({
  title,
  images,
  selectImageLabel,
  openImageLabel,
  previousImageLabel,
  nextImageLabel,
  closeImageLabel,
  imageCounterLabel,
}: {
  title: string;
  images: string[];
  selectImageLabel: (position: number) => string;
  openImageLabel: string;
  previousImageLabel: string;
  nextImageLabel: string;
  closeImageLabel: string;
  imageCounterLabel: (current: number, total: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  if (images.length === 0) {
    return (
      <div className="grid min-h-[30rem] place-items-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_28%_20%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_44%),linear-gradient(145deg,var(--muted),var(--background))] px-8 text-center shadow-[0_24px_70px_color-mix(in_srgb,var(--foreground)_8%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 lg:min-h-[44rem]">
        <span className="max-w-md font-[var(--font-cormorant-garamond)] text-5xl font-light italic tracking-[-0.045em] text-foreground/75 sm:text-7xl">
          {title}
        </span>
      </div>
    );
  }

  const resolvedActiveIndex = Math.min(activeIndex, images.length - 1);
  const activeImage = images[resolvedActiveIndex];
  const showThumbnails = images.length > 1;

  return (
    <div
      className={
        showThumbnails
          ? "grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(9rem,.55fr)]"
          : "grid"
      }
    >
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={openImageLabel}
        className="group relative min-h-120 cursor-zoom-in overflow-hidden rounded-[2rem] bg-muted shadow-[0_24px_70px_color-mix(in_srgb,var(--foreground)_8%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:min-h-[44rem]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={activeImage}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.99 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.2, 0, 0, 1],
            }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage}
              alt={title}
              fill
              priority={resolvedActiveIndex === 0}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </motion.div>
        </AnimatePresence>
      </button>

      {showThumbnails ? (
        <div className="flex gap-2 lg:flex-col overflow-x-auto pb-1 lg:max-h-176 lg:content-start lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 p-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={selectImageLabel(index + 1)}
              aria-current={index === resolvedActiveIndex ? "true" : undefined}
              className="relative min-h-20 min-w-20 shrink-0 overflow-hidden rounded-xl lg:rounded-2xl bg-muted shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_7%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 transition-[opacity,transform,box-shadow] duration-200 hover:opacity-90 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 aria-current:ring-2 aria-current:ring-primary aria-current:ring-offset-2 lg:aspect-[1/1] lg:min-h-20 lg:w-full"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 18vw, 80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <ProductLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        title={title}
        activeIndex={resolvedActiveIndex}
        onActiveIndexChange={setActiveIndex}
        closeLabel={closeImageLabel}
        previousLabel={previousImageLabel}
        nextLabel={nextImageLabel}
        selectImageLabel={selectImageLabel}
        imageCounterLabel={imageCounterLabel}
      />
    </div>
  );
}
