import { DEFAULT_HERO_TEXT_BLOCK, clampPct } from "./hero-text";
import type { HeroTextBlock, HeroTextLayer } from "./types";

function nextZ(layer: HeroTextLayer): number {
  return layer.blocks.reduce((max, b) => Math.max(max, b.z), 0) + 1;
}

/** Append a new default block with the given id. */
export function addBlock(layer: HeroTextLayer, id: string): HeroTextLayer {
  const block: HeroTextBlock = {
    ...DEFAULT_HERO_TEXT_BLOCK,
    id,
    z: nextZ(layer),
  };
  return { ...layer, blocks: [...layer.blocks, block] };
}

/** Patch the block with the given id. */
export function updateBlock(
  layer: HeroTextLayer,
  id: string,
  patch: Partial<HeroTextBlock>,
): HeroTextLayer {
  return {
    ...layer,
    blocks: layer.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  };
}

/** Remove the block with the given id. */
export function removeBlock(layer: HeroTextLayer, id: string): HeroTextLayer {
  return { ...layer, blocks: layer.blocks.filter((b) => b.id !== id) };
}

/** Duplicate a block: same style, new id, nudged by 4% and on top. */
export function duplicateBlock(
  layer: HeroTextLayer,
  id: string,
  newId: string,
): HeroTextLayer {
  const source = layer.blocks.find((b) => b.id === id);
  if (!source) return layer;
  const copy: HeroTextBlock = {
    ...source,
    id: newId,
    xPct: clampPct(source.xPct + 4),
    yPct: clampPct(source.yPct + 4),
    z: nextZ(layer),
  };
  return { ...layer, blocks: [...layer.blocks, copy] };
}

/** Move a block's anchor to a clamped (x, y) percentage position. */
export function moveBlock(
  layer: HeroTextLayer,
  id: string,
  xPct: number,
  yPct: number,
): HeroTextLayer {
  return updateBlock(layer, id, {
    xPct: clampPct(xPct),
    yPct: clampPct(yPct),
  });
}

/** Raise a block above all others. */
export function bringToFront(layer: HeroTextLayer, id: string): HeroTextLayer {
  return updateBlock(layer, id, { z: nextZ(layer) });
}

export interface HeroTextBlockDisplay {
  /** Text to paint on the editor's design surface. */
  text: string;
  /** True when `text` came from the Portuguese source, not the block itself. */
  isSourceFallback: boolean;
}

/**
 * Decides what a block shows on the editor surface.
 *
 * While translating, a block's own `content` is blank until the translator
 * fills it in. Painting that blank directly collapses the block to an
 * invisible sliver, so it cannot be clicked to select and translate it. Fall
 * back to the Portuguese source so every block stays visible and selectable;
 * the caller dims the text when `isSourceFallback` is true.
 */
export function resolveHeroTextBlockDisplay(
  content: string,
  sourceContent: string | undefined,
): HeroTextBlockDisplay {
  if (content.trim()) return { text: content, isSourceFallback: false };
  if (sourceContent?.trim()) {
    return { text: sourceContent, isSourceFallback: true };
  }
  // Never return an empty string: a zero-height box cannot be grabbed.
  return { text: " ", isSourceFallback: false };
}
