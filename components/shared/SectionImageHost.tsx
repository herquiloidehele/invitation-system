import type { ReactNode } from "react";

import type { ImageLayer, ImageLayerSectionKey } from "@/lib/types";
import { itemsForSection } from "@/lib/image-layer";
import ImageLayerOverlay from "./ImageLayerOverlay";

interface SectionImageHostProps {
  sectionKey: ImageLayerSectionKey;
  layer?: ImageLayer | null;
  children: ReactNode;
  className?: string;
  /** Allows entrance hero covers to stay above images until reveal. */
  frontLayerPosition?: "above-content" | "interleaved";
}

/**
 * Wraps a section so free-floating images can be layered behind and in front
 * of its content. Always emits `data-section-key` (even with no images) so the
 * admin editor can hit-test the section's rect. When the section has images it
 * keeps overflow visible so images can spill over an immediate neighbour.
 * Avoid CSS containment here: it changes the layout viewport of embedded
 * sections such as Canva when the first image is assigned.
 */
export default function SectionImageHost({
  sectionKey,
  layer,
  children,
  className,
  frontLayerPosition = "above-content",
}: SectionImageHostProps) {
  const items = itemsForSection(layer, sectionKey);
  const behind = items.filter((i) => i.z < 0);
  const front = items.filter((i) => i.z >= 0);

  return (
    <div
      data-section-key={sectionKey}
      className={className}
      style={{
        position: "relative",
        overflow: "visible",
      }}
    >
      <ImageLayerOverlay items={behind} band="behind" />
      <div
        data-section-image-content="true"
        style={
          frontLayerPosition === "interleaved"
            ? { position: "relative" }
            : { position: "relative", zIndex: 1 }
        }
      >
        {children}
      </div>
      <ImageLayerOverlay
        items={front}
        band="front"
        zIndex={frontLayerPosition === "interleaved" ? 4 : undefined}
      />
    </div>
  );
}
