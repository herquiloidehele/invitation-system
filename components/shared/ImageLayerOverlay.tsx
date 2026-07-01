import type { ImageItem } from "@/lib/types";
import {
  imageItemBoxStyle,
  imageItemFrameStyle,
  imageItemImgStyle,
} from "@/lib/image-layer";

interface ImageLayerOverlayProps {
  /** Items for ONE section and ONE band (caller pre-filters). */
  items: ImageItem[];
  /** Which band this layer represents (informational; affects nothing visually). */
  band: "behind" | "front";
}

/**
 * Presentational renderer for a single section/band of free-floating images.
 * Pure CSS, SSR-friendly, non-interactive. The host decides which items go in
 * which band (by `z` sign) and where the bands sit relative to content.
 */
export default function ImageLayerOverlay({
  items,
  band,
}: ImageLayerOverlayProps) {
  if (items.length === 0) return null;
  return (
    <div
      aria-hidden
      data-image-band={band}
      className="pointer-events-none absolute inset-0"
      style={{ isolation: "isolate", zIndex: band === "front" ? 2 : 0 }}
    >
      {items.map((item) => (
        <div key={item.id} style={imageItemBoxStyle(item)}>
          <div style={imageItemFrameStyle(item)}>
            {/* Plain <img>: free-floating items accept arbitrary/pasted URLs
                that next/image's allowlisted-domain loader would reject. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              style={imageItemImgStyle(item)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
