import type { ReactNode } from "react";

import type { ImageLayer } from "@/lib/types";
import ImageLayerOverlay from "./ImageLayerOverlay";

interface ImageCanvasProps {
  layer?: ImageLayer | null;
  children: ReactNode;
}

/**
 * Wraps a whole invitation layout so free-floating images can be layered behind
 * and in front of all content on one page-wide canvas. Items are positioned
 * relative to this element's box (page width × full scroll height). The
 * `data-image-canvas` hook lets the admin editor read the canvas rect to map
 * cursor → percentage. Always present (even with no images) so the editor can
 * place the first one.
 */
export default function ImageCanvas({ layer, children }: ImageCanvasProps) {
  const items = layer?.items ?? [];

  if (items.length === 0) {
    return (
      <div data-image-canvas style={{ position: "relative" }}>
        {children}
      </div>
    );
  }

  const behind = items.filter((i) => i.z < 0);
  const front = items.filter((i) => i.z >= 0);

  return (
    <div data-image-canvas style={{ position: "relative" }}>
      <ImageLayerOverlay items={behind} band="behind" />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <ImageLayerOverlay items={front} band="front" />
    </div>
  );
}
