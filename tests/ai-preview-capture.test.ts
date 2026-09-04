// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
  MAX_TILES,
  TILE_HEIGHT_PX,
  captureHeight,
  sliceCanvas,
} from "@/lib/ai-preview-capture";

function fakeCanvas(width: number, height: number) {
  // jsdom has no 2D context; stub just enough for slicing.
  const made: Array<{ width: number; height: number }> = [];
  const canvas = {
    width,
    height,
    getContext: () => ({ drawImage: () => undefined }),
    toDataURL: () => "data:image/jpeg;base64,AAA",
  } as unknown as HTMLCanvasElement;
  const create = document.createElement.bind(document);
  document.createElement = ((tag: string) => {
    if (tag !== "canvas") return create(tag);
    const c = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: () => undefined }),
      toDataURL: () => "data:image/jpeg;base64,BBB",
    };
    made.push(c as never);
    return c as unknown as HTMLElement;
  }) as typeof document.createElement;
  return {
    canvas,
    made,
    restore: () => {
      document.createElement = create;
    },
  };
}

describe("sliceCanvas", () => {
  it("splits a tall canvas into tiles of the given height, capped", () => {
    const { canvas, made, restore } = fakeCanvas(780, 10_000);
    try {
      const tiles = sliceCanvas(canvas, 2800, 3);
      expect(tiles).toHaveLength(3);
      expect(made.map((c) => c.height)).toEqual([2800, 2800, 2800]);
    } finally {
      restore();
    }
  });

  it("keeps a short page as one tile of its own height", () => {
    const { canvas, made, restore } = fakeCanvas(780, 900);
    try {
      expect(sliceCanvas(canvas, 2800, 4)).toHaveLength(1);
      expect(made[0].height).toBe(900);
    } finally {
      restore();
    }
  });

  it("exports the tiling constants the bridge and console agree on", () => {
    expect(TILE_HEIGHT_PX).toBe(1400);
    expect(MAX_TILES).toBe(4);
  });
});

describe("captureHeight", () => {
  it("takes the whole page when it fits the tile budget", () => {
    expect(captureHeight(2730, 4)).toBe(2730);
  });

  it("caps at the tile budget for long pages", () => {
    expect(captureHeight(20000, 2)).toBe(2800);
  });

  it("never returns zero", () => {
    expect(captureHeight(0, 4)).toBe(1);
  });
});
