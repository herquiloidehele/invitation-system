import { heroTextBlockStyle, type ResolvedHeroFonts } from "@/lib/hero-text";
import type { HeroTextLayer } from "@/lib/types";

interface HeroTextOverlayProps {
  layer?: HeroTextLayer | null;
  fonts: ResolvedHeroFonts;
}

/**
 * Renders the free-positioned custom text blocks over the hero media.
 * Pure/presentational; renders nothing when there are no blocks.
 *
 * The host hero `<section>` MUST set `containerType: "inline-size"` so the
 * `cqw` font sizes resolve against the hero width.
 */
export default function HeroTextOverlay({
  layer,
  fonts,
}: HeroTextOverlayProps) {
  const blocks = layer?.blocks ?? [];
  if (blocks.length === 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 20 }}
      data-hero-text-overlay
    >
      {blocks.map((block) => (
        <div key={block.id} style={heroTextBlockStyle(block, fonts)}>
          {block.content}
        </div>
      ))}
    </div>
  );
}
