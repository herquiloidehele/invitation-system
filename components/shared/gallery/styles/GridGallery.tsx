"use client";

import GalleryPhoto from "../GalleryPhoto";
import type { GalleryStyleProps } from "../types";

export default function GridGallery({
  images,
  onOpenLightbox,
}: GalleryStyleProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridAutoRows: 96,
        gap: 8,
        maxWidth: 460,
        margin: "0 auto",
        padding: "0 12px",
      }}
    >
      {images.map((img, i) => {
        const tall = i % 5 === 0;
        const wide = i % 5 === 3;
        return (
          <button
            key={i}
            onClick={() => onOpenLightbox?.(i)}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 10,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: "#000",
              gridRow: tall ? "span 2" : undefined,
              gridColumn: wide ? "span 2" : undefined,
            }}
          >
            <GalleryPhoto image={img} sizes="200px" />
          </button>
        );
      })}
    </div>
  );
}
