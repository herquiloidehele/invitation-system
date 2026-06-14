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
