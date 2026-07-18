import type { ReactNode } from "react";

import type { ImageLayer, ImageLayerSectionKey } from "@/lib/types";
import ImageLayerOverlay from "./ImageLayerOverlay";

interface ImageCanvasProps {
  layer?: ImageLayer | null;
  children?: ReactNode;
  /**
   * Normal invitations render "front" images above content. Entrance layouts
   * can interleave that band with hero internals so images sit above revealed
   * hero media but below temporary curtain/cover surfaces.
   */
  frontLayerPosition?: "above-content" | "below-content" | "interleaved";
  /** Section keys rendered by nested SectionImageHost instances. */
  hostedSectionKeys?: readonly ImageLayerSectionKey[];
}

/**
 * Wraps a whole invitation layout so free-floating images can be layered behind
 * and in front of all content on one page-wide canvas. Items are positioned
 * relative to this element's box (page width × full scroll height). The
 * `data-image-canvas` hook lets the admin editor read the canvas rect to map
 * cursor → percentage. Always present (even with no images) so the editor can
 * place the first one.
 */
export default function ImageCanvas({
  layer,
  children,
  frontLayerPosition = "above-content",
  hostedSectionKeys,
}: ImageCanvasProps) {
  const hosted = new Set(hostedSectionKeys ?? []);
  const items = (layer?.items ?? []).filter(
    (item) => !item.sectionKey || !hosted.has(item.sectionKey),
  );

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
    <div
      data-image-canvas
      style={{ position: "relative", isolation: "isolate" }}
    >
      <ImageLayerOverlay items={behind} band="behind" />
      {frontLayerPosition === "below-content" && (
        <ImageLayerOverlay items={front} band="front" zIndex={0} />
      )}
      <div
        style={
          frontLayerPosition === "interleaved"
            ? { position: "relative" }
            : { position: "relative", zIndex: 1 }
        }
      >
        {children}
      </div>
      {frontLayerPosition === "interleaved" && (
        <ImageLayerOverlay items={front} band="front" zIndex={4} />
      )}
      {frontLayerPosition === "above-content" && (
        <ImageLayerOverlay items={front} band="front" />
      )}
    </div>
  );
}
