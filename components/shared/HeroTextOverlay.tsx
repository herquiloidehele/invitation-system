"use client";

import { type RefObject, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
import {
  advanceHeroTextPlaybackState,
  initialHeroTextPlaybackState,
  subscribeToHeroTextVideoTime,
  type HeroTextPlaybackState,
} from "@/lib/hero-text-timing";
import type { HeroTextBlock, HeroTextLayer } from "@/lib/types";

const EMPTY_BLOCKS: HeroTextBlock[] = [];

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
  /** The displayed hero video's clock. Omit for image/static hero media. */
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** Enables per-block timing without reading the mutable ref during render. */
  timingEnabled?: boolean;
}

function initialPlaybackStates(
  blocks: HeroTextBlock[],
  hasVideoClock: boolean,
): Record<string, HeroTextPlaybackState> {
  return Object.fromEntries(
    blocks.map((block) => [
      block.id,
      hasVideoClock ? initialHeroTextPlaybackState(block) : "visible",
    ]),
  );
}

export function AnimatedHeroTextBlock({
  block,
  fonts,
  timed,
}: {
  block: HeroTextBlock;
  fonts: ResolvedHeroFonts;
  timed: boolean;
}) {
  return (
    <motion.div
      style={heroTextBlockPositionStyle(block)}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <motion.div
        style={heroTextBlockTextStyle(block, fonts)}
        variants={heroTextBlockItem}
        initial={timed ? "hidden" : undefined}
        animate={timed ? "visible" : undefined}
      >
        {block.content}
      </motion.div>
    </motion.div>
  );
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
  videoRef,
  timingEnabled = false,
}: HeroTextOverlayProps) {
  // Load any non-builtin Google Fonts chosen for blocks (ref-counted, no-op
  // for builtins). Called unconditionally to satisfy the rules of hooks.
  useDynamicFonts(heroTextLayerFontStacks(layer));
  const reduceMotion = useReducedMotion();
  const blocks = layer?.blocks ?? EMPTY_BLOCKS;
  const [playbackStates, setPlaybackStates] = useState(() =>
    initialPlaybackStates(blocks, timingEnabled),
  );

  useEffect(() => {
    if (!timingEnabled) return;
    const video = videoRef?.current;
    if (!video) return;

    return subscribeToHeroTextVideoTime(video, (currentTime) => {
      setPlaybackStates((previous) => {
        let changed = false;
        const next: Record<string, HeroTextPlaybackState> = {};
        for (const block of blocks) {
          const previousState =
            previous[block.id] ?? initialHeroTextPlaybackState(block);
          const nextState = advanceHeroTextPlaybackState(
            block,
            previousState,
            currentTime,
          );
          next[block.id] = nextState;
          if (nextState !== previousState) changed = true;
        }
        if (Object.keys(previous).length !== blocks.length) changed = true;
        return changed ? next : previous;
      });
    });
  }, [blocks, timingEnabled, videoRef]);

  if (blocks.length === 0) return null;

  const visibleBlocks = blocks.filter((block) => {
    const fallback = timingEnabled
      ? initialHeroTextPlaybackState(block)
      : "visible";
    return (playbackStates[block.id] ?? fallback) === "visible";
  });
  const animate = play && !reduceMotion;

  if (!animate) {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 20 }}
        data-hero-text-overlay
      >
        {visibleBlocks.map((block) => (
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
      <AnimatePresence>
        {visibleBlocks.map((block) => (
          <AnimatedHeroTextBlock
            key={block.id}
            block={block}
            fonts={fonts}
            timed={
              timingEnabled &&
              initialHeroTextPlaybackState(block) === "waiting"
            }
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
