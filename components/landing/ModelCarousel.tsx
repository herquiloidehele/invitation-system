"use client";

import {
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ModelCarouselIndicator } from "./ModelCarouselIndicator";

type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

/**
 * `active: false` above 768px makes Embla stop writing transforms and clear its
 * inline styles, so the same track element becomes a CSS grid via Tailwind.
 */
const MODEL_CAROUSEL_OPTIONS: CarouselOptions = {
  active: true,
  align: "start",
  breakpoints: {
    "(min-width: 768px)": { active: false },
  },
};

/**
 * The landing sections wrap this in `px-5 sm:px-8`. Cancel only the right side
 * below `md`, so the first slide stays aligned with the section headings while
 * the track bleeds off the right edge. Restored for the desktop grid.
 */
const BLEED_CLASS_NAME = "-mr-5 sm:-mr-8 md:mr-0";

/**
 * Classes every slide must carry, passed to `LandingModelCard`'s `className`.
 *
 * `h-auto` below `md` is load-bearing: the card's own `h-full` makes its cross
 * size definite, which switches off flex `align-items: stretch` and lets slides
 * collapse to their own content height. Grid restores `h-full` at `md`, where a
 * definite row height makes it work as intended.
 */
export const MODEL_CAROUSEL_SLIDE_CLASS_NAME =
  "min-w-0 shrink-0 grow-0 basis-[85%] h-auto md:basis-auto md:h-full";

export type ModelCarouselRenderContext = {
  index: number;
  isMobile: boolean;
};

export function ModelCarousel<T>({
  items,
  renderItem,
  label,
  contentClassName,
  resetKey,
  animateOnMount = true,
}: {
  items: T[];
  /** Must return an element carrying its own React `key`. */
  renderItem: (item: T, context: ModelCarouselRenderContext) => ReactNode;
  label: string;
  contentClassName: string;
  resetKey?: string;
  animateOnMount?: boolean;
}) {
  const isMobile = useIsMobile();
  const [viewportRef, api] = useEmblaCarousel(MODEL_CAROUSEL_OPTIONS);

  useEffect(() => {
    api?.scrollTo(0, true);
  }, [api, resetKey]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!api) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        api.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        api.scrollNext();
      }
    },
    [api],
  );

  return (
    <div
      className="relative"
      onKeyDownCapture={handleKeyDown}
      role={isMobile ? "region" : undefined}
      aria-roledescription={isMobile ? "carousel" : undefined}
      aria-label={isMobile ? label : undefined}
    >
      <div
        ref={viewportRef}
        className={cn("overflow-hidden md:overflow-visible", BLEED_CLASS_NAME)}
      >
        <div className={cn("flex", contentClassName)}>
          <AnimatePresence mode="popLayout" initial={animateOnMount}>
            {items.map((item, index) => renderItem(item, { index, isMobile }))}
          </AnimatePresence>
        </div>
      </div>
      <ModelCarouselIndicator
        api={api}
        slideCount={items.length}
        label={label}
      />
    </div>
  );
}
