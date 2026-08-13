"use client";

import { useEffect, useState } from "react";
import { type UseEmblaCarouselType } from "embla-carousel-react";
import {
  getCarouselIndicatorMode,
  getCarouselThumbMetrics,
} from "@/lib/landing-carousel";
import { cn } from "@/lib/utils";

export type ModelCarouselApi = UseEmblaCarouselType[1];

export function ModelCarouselIndicator({
  api,
  slideCount,
  label,
}: {
  api: ModelCarouselApi;
  slideCount: number;
  label: string;
}) {
  const mode = getCarouselIndicatorMode(slideCount);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!api) return;
    const syncSelected = () => setSelectedIndex(api.selectedScrollSnap());
    syncSelected();
    api.on("select", syncSelected);
    api.on("reInit", syncSelected);
    return () => {
      api.off("select", syncSelected);
      api.off("reInit", syncSelected);
    };
  }, [api]);

  useEffect(() => {
    if (!api || mode !== "bar") return;
    const syncProgress = () => setProgress(api.scrollProgress());
    syncProgress();
    api.on("scroll", syncProgress);
    api.on("reInit", syncProgress);
    return () => {
      api.off("scroll", syncProgress);
      api.off("reInit", syncProgress);
    };
  }, [api, mode]);

  if (mode === "none") return null;

  if (mode === "dots") {
    return (
      <div className="mt-2 flex items-center justify-center md:hidden">
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => api?.scrollTo(index)}
            aria-label={`${label} ${index + 1}/${slideCount}`}
            aria-current={index === selectedIndex ? "true" : undefined}
            className="flex h-11 w-6 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "w-5 bg-foreground"
                  : "w-1.5 bg-foreground/25",
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  const thumb = getCarouselThumbMetrics(slideCount, progress);

  return (
    <div className="mt-6 flex justify-center md:hidden">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={slideCount}
        aria-valuenow={selectedIndex + 1}
        className="relative h-1 w-28 overflow-hidden rounded-full bg-foreground/15"
      >
        <div
          className="absolute inset-y-0 rounded-full bg-foreground/60"
          style={{
            width: `${thumb.widthPercent}%`,
            left: `${thumb.leftPercent}%`,
          }}
        />
      </div>
    </div>
  );
}
