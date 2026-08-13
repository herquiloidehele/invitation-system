"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
  const pagerRef = useRef<HTMLDivElement | null>(null);

  // Keep the dots and the desktop thumbnails in sync with a swipe.
  useEffect(() => {
    const pager = pagerRef.current;
    if (!pager) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = pager.clientWidth;
        if (width > 0) {
          setActiveIndex(Math.round(pager.scrollLeft / width));
        }
      });
    };

    pager.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      pager.removeEventListener("scroll", onScroll);
    };
  }, []);

  function goTo(index: number) {
    setActiveIndex(index);
    const pager = pagerRef.current;
    if (pager) {
      pager.scrollTo({ left: pager.clientWidth * index, behavior: "smooth" });
    }
  }

  if (images.length === 0) {
    return (
      <div className="grid aspect-4/5 place-items-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_28%_20%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_44%),linear-gradient(145deg,var(--muted),var(--background))] px-8 text-center shadow-[0_24px_70px_color-mix(in_srgb,var(--foreground)_8%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 lg:aspect-5/4">
        <span className="max-w-md text-2xl font-medium tracking-[-0.025em] text-foreground/70 sm:text-3xl">
          {title}
        </span>
      </div>
    );
  }

  const resolvedActiveIndex = Math.min(activeIndex, images.length - 1);
  const showThumbnails = images.length > 1;

  return (
    <div
      className={
        showThumbnails
          ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_6rem]"
          : "grid"
      }
    >
      <div className="min-w-0">
        <div
          ref={pagerRef}
          className="flex aspect-4/5 snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-[2rem] bg-surface-warm shadow-[0_24px_70px_color-mix(in_srgb,var(--foreground)_8%,transparent)] outline outline-1 -outline-offset-1 outline-black/10 [scrollbar-width:none] lg:aspect-5/4 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={openImageLabel}
              className="relative w-full shrink-0 snap-center cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <Image
                src={image}
                alt={title}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {showThumbnails ? (
          <div className="mt-3 flex justify-center gap-1.5 lg:hidden">
            {images.map((image, index) => (
              <button
                key={`dot-${image}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={selectImageLabel(index + 1)}
                aria-current={index === resolvedActiveIndex ? "true" : undefined}
                className="h-6 w-6 rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={`block h-full w-full rounded-full transition-colors duration-200 ${
                    index === resolvedActiveIndex
                      ? "bg-foreground"
                      : "bg-foreground/25"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showThumbnails ? (
        <div className="hidden gap-2 lg:flex lg:max-h-176 lg:flex-col lg:content-start lg:overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={`thumb-${image}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              aria-label={selectImageLabel(index + 1)}
              aria-current={index === resolvedActiveIndex ? "true" : undefined}
              className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-surface-warm outline outline-1 -outline-offset-1 outline-black/10 transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-current:ring-2 aria-current:ring-primary aria-current:ring-offset-1"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="96px"
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
        onActiveIndexChange={goTo}
        closeLabel={closeImageLabel}
        previousLabel={previousImageLabel}
        nextLabel={nextImageLabel}
        selectImageLabel={selectImageLabel}
        imageCounterLabel={imageCounterLabel}
      />
    </div>
  );
}
