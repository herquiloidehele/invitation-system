"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  heroTextBlockStyle,
  heroTextBlockPositionStyle,
  heroTextBlockTextStyle,
  heroTextLayerFontStacks,
  type ResolvedHeroFonts,
} from "@/lib/hero-text";
import {
  heroTextBlockContainer,
  heroTextBlockItem,
} from "@/components/shared/animations";
import { useDynamicFonts } from "@/hooks/useDynamicFont";
import type { HeroTextLayer } from "@/lib/types";

interface HeroTextOverlayProps {
  layer?: HeroTextLayer | null;
  fonts: ResolvedHeroFonts;
  /**
   * Play the cinematic blur + rise entrance. Set true by guest reveal surfaces
   * (after the envelope opens, on the video-entrance / curtain / rich-external
   * reveals). Defaults to false so admin previews and any other caller render
   * the blocks statically. Ignored when the user prefers reduced motion.
   */
  play?: boolean;
}

/**
 * Renders the free-positioned custom text blocks over the hero media.
 * Pure/presentational; renders nothing when there are no blocks.
 *
 * The host hero `<section>` MUST set `containerType: "inline-size"` so the
 * `cqw` font sizes resolve against the hero width.
 *
 * When `play` is set (and motion is allowed) the blocks animate in via a
 * staggered framer-motion container. The animator lives on an INNER element so
 * its transform never clobbers the block's `translate(-50%,-50%)` centering,
 * which stays on the outer positioned element.
 */
export default function HeroTextOverlay({
  layer,
  fonts,
  play = false,
}: HeroTextOverlayProps) {
  // Load any non-builtin Google Fonts chosen for blocks (ref-counted, no-op
  // for builtins). Called unconditionally to satisfy the rules of hooks.
  useDynamicFonts(heroTextLayerFontStacks(layer));
  const reduceMotion = useReducedMotion();

  const blocks = layer?.blocks ?? [];
  if (blocks.length === 0) return null;

  const animate = play && !reduceMotion;

  if (!animate) {
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

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 20 }}
      data-hero-text-overlay
      variants={heroTextBlockContainer}
      initial="hidden"
      animate="visible"
    >
      {blocks.map((block) => (
        <div key={block.id} style={heroTextBlockPositionStyle(block)}>
          <motion.div
            style={heroTextBlockTextStyle(block, fonts)}
            variants={heroTextBlockItem}
          >
            {block.content}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
