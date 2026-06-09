"use client";

import GalleryPhoto from "../GalleryPhoto";
import type { GalleryStyleProps } from "../types";

export default function FilmstripGallery({
  images,
  onOpenLightbox,
}: GalleryStyleProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        padding: "4px 16px 14px",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {images.map((img, i) => (
        <button
          key={i}
          onClick={() => onOpenLightbox?.(i)}
          style={{
            flex: "0 0 auto",
            width: i % 3 === 1 ? 230 : 170,
            height: 240,
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            scrollSnapAlign: "center",
            border: "none",
            padding: 0,
            cursor: "pointer",
            background: "#000",
          }}
        >
          <GalleryPhoto image={img} sizes="230px" />
        </button>
      ))}
    </div>
  );
}
