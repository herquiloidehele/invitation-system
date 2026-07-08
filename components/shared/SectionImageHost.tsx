import type { ReactNode } from "react";

import type { ImageLayer, ImageLayerSectionKey } from "@/lib/types";
import { itemsForSection } from "@/lib/image-layer";
import ImageLayerOverlay from "./ImageLayerOverlay";

interface SectionImageHostProps {
  sectionKey: ImageLayerSectionKey;
  layer?: ImageLayer | null;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a section so free-floating images can be layered behind and in front
 * of its content. Always emits `data-section-key` (even with no images) so the
 * admin editor can hit-test the section's rect. When the section has images it
 * becomes a positioned container-query context with overflow visible so images
 * can spill over an immediate neighbour.
 */
export default function SectionImageHost({
  sectionKey,
  layer,
  children,
  className,
}: SectionImageHostProps) {
  const items = itemsForSection(layer, sectionKey);

  if (items.length === 0) {
    return (
      <div
        data-section-key={sectionKey}
        className={className}
        style={{ position: "relative" }}
      >
        {children}
      </div>
    );
  }

  const behind = items.filter((i) => i.z < 0);
  const front = items.filter((i) => i.z >= 0);

  return (
    <div
      data-section-key={sectionKey}
      className={className}
      style={{
        position: "relative",
        containerType: "inline-size",
        overflow: "visible",
      }}
    >
      <ImageLayerOverlay items={behind} band="behind" />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <ImageLayerOverlay items={front} band="front" />
    </div>
  );
}
