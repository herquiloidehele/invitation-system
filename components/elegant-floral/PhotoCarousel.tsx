"use client";

import { useRef, useState } from "react";
import type { LocationPhoto, TemplateTheme } from "@/lib/types";
import PaginationDots from "./PaginationDots";

interface PhotoCarouselProps {
  photos: LocationPhoto[];
  theme: Pick<TemplateTheme, "secondary" | "cardBorder">;
  /** Images shown side-by-side per page (default 2, matching the Canva). */
  perPage?: number;
  aspectRatio?: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Venue photos shown two-up with a horizontal scroll-snap slider (swipe on
 * mobile / drag on desktop). Pagination dots track the page; they only appear
 * when there's more than one page.
 */
export default function PhotoCarousel({
  photos,
  theme,
  perPage = 2,
  aspectRatio = "3 / 4",
}: PhotoCarouselProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);

  if (photos.length === 0) return null;
  const pages = chunk(photos, perPage);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    setPage(Math.round(el.scrollLeft / w));
  };

  const goTo = (p: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" });
  };

  const GAP = 10;
  const itemFlex = `0 0 calc(${100 / perPage}% - ${(GAP * (perPage - 1)) / perPage}px)`;

  return (
    <div style={{ width: "100%" }}>
      <div
        ref={ref}
        onScroll={onScroll}
        className="ef-carousel"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`.ef-carousel::-webkit-scrollbar{display:none}`}</style>
        {pages.map((group, pi) => (
          <div
            key={pi}
            style={{
              flex: "0 0 100%",
              scrollSnapAlign: "start",
              display: "flex",
              gap: GAP,
            }}
          >
            {group.map((p, i) => (
              <div
                key={`${p.src}-${i}`}
                style={{
                  flex: itemFlex,
                  aspectRatio,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${theme.cardBorder}`,
                  background: "rgba(0,0,0,0.03)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${p.positionX ?? 50}% ${p.positionY ?? 50}%`,
                    transform:
                      p.zoom && p.zoom !== 1 ? `scale(${p.zoom})` : undefined,
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <PaginationDots
        count={pages.length}
        active={page}
        color={theme.secondary}
        onSelect={goTo}
        style={{ marginTop: 12 }}
      />
    </div>
  );
}
