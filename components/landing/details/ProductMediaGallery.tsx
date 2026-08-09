"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function ProductMediaGallery({
  title,
  images,
  selectImageLabel,
}: {
  title: string;
  images: string[];
  selectImageLabel: (position: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
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
      <div className="relative min-h-[30rem] overflow-hidden rounded-[2rem] bg-muted shadow-[0_24px_70px_color-mix(in_srgb,var(--foreground)_8%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 lg:min-h-[44rem]">
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
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {showThumbnails ? (
        <div className="flex gap-2 flex-col overflow-x-auto pb-1 lg:grid lg:max-h-176 lg:grid-cols-1 lg:content-start lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={selectImageLabel(index + 1)}
              aria-current={index === resolvedActiveIndex ? "true" : undefined}
              className="relative min-h-20 min-w-20 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_7%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 transition-[opacity,transform,box-shadow] duration-200 hover:opacity-90 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 aria-current:ring-2 aria-current:ring-primary aria-current:ring-offset-2 lg:aspect-[4/3] lg:min-h-36 lg:w-full"
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
    </div>
  );
}
