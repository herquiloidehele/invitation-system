"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SWIPE_THRESHOLD = 60;

export function ProductLightbox({
  open,
  onOpenChange,
  images,
  title,
  activeIndex,
  onActiveIndexChange,
  closeLabel,
  previousLabel,
  nextLabel,
  selectImageLabel,
  imageCounterLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  title: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  selectImageLabel: (position: number) => string;
  imageCounterLabel: (current: number, total: number) => string;
}) {
  const reduceMotion = useReducedMotion();
  const total = images.length;
  const hasMultiple = total > 1;
  const resolvedIndex =
    total > 0 ? ((activeIndex % total) + total) % total : 0;
  const activeImage = images[resolvedIndex];

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      onActiveIndexChange(((index % total) + total) % total);
    },
    [onActiveIndexChange, total],
  );

  const goNext = useCallback(() => goTo(resolvedIndex + 1), [goTo, resolvedIndex]);
  const goPrev = useCallback(() => goTo(resolvedIndex - 1), [goTo, resolvedIndex]);

  useEffect(() => {
    if (!open || !hasMultiple) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, hasMultiple, goNext, goPrev]);

  if (total === 0) return null;

  const backdropTransition = reduceMotion
    ? ""
    : "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={`fixed inset-0 z-50 bg-ink/90 backdrop-blur-md ${backdropTransition}`}
        />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col outline-none">
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          {/* Top bar: counter + close */}
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium tabular-nums text-white/90">
              {imageCounterLabel(resolvedIndex + 1, total)}
            </span>
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white transition-[transform,background-color] duration-200 hover:bg-white/20 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          {/* Stage */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-14">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activeImage}
                drag={hasMultiple ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x <= -SWIPE_THRESHOLD) goNext();
                  else if (info.offset.x >= SWIPE_THRESHOLD) goPrev();
                }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.24,
                  ease: [0.2, 0, 0, 1],
                }}
                className="relative flex h-full w-full items-center justify-center"
              >
                <Image
                  src={activeImage}
                  alt={title}
                  fill
                  priority
                  sizes="100vw"
                  className="pointer-events-none select-none object-contain"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {hasMultiple ? (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={previousLabel}
                  className="absolute left-2 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-[transform,background-color] duration-200 hover:bg-white/20 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-4"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={nextLabel}
                  className="absolute right-2 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-[transform,background-color] duration-200 hover:bg-white/20 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-4"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>

          {/* Thumbnail strip */}
          {hasMultiple ? (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={selectImageLabel(index + 1)}
                  aria-current={index === resolvedIndex ? "true" : undefined}
                  className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5 opacity-60 outline outline-1 -outline-offset-1 outline-white/15 transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 aria-current:opacity-100 aria-current:outline-2 aria-current:outline-white"
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
