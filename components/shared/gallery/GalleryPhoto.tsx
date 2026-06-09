"use client";

import Image from "next/image";
import type { ResolvedGalleryImage } from "@/lib/couple-gallery";

/** A single cropped, focal-point-aware gallery photo. Parent must be
 *  `position: relative; overflow: hidden`. */
export default function GalleryPhoto({
  image,
  sizes,
  priority = false,
}: {
  image: ResolvedGalleryImage;
  sizes: string;
  priority?: boolean;
}) {
  const customized =
    image.positionX !== 50 || image.positionY !== 50 || image.zoom !== 1;

  return (
    <Image
      src={image.src}
      alt={image.caption ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      style={{
        objectFit: "cover",
        ...(customized
          ? {
              objectPosition: `${image.positionX}% ${image.positionY}%`,
              transform: image.zoom !== 1 ? `scale(${image.zoom})` : undefined,
              transformOrigin: `${image.positionX}% ${image.positionY}%`,
            }
          : {}),
      }}
    />
  );
}
