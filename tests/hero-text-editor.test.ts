import { describe, expect, it } from "vitest";

import {
  addBlock,
  bringToFront,
  duplicateBlock,
  moveBlock,
  removeBlock,
  updateBlock,
} from "@/lib/hero-text-editor";
import { EMPTY_HERO_TEXT_LAYER } from "@/lib/hero-text";

describe("addBlock", () => {
  it("appends a default block with the given id and the next z", () => {
    const layer = addBlock(EMPTY_HERO_TEXT_LAYER, "id-1");
    expect(layer.blocks).toHaveLength(1);
    expect(layer.blocks[0].id).toBe("id-1");
    expect(layer.blocks[0].z).toBe(1);
    const layer2 = addBlock(layer, "id-2");
    expect(layer2.blocks[1].z).toBe(2);
  });

  it("does not mutate the input layer", () => {
    const layer = addBlock(EMPTY_HERO_TEXT_LAYER, "id-1");
    expect(EMPTY_HERO_TEXT_LAYER.blocks).toHaveLength(0);
    expect(layer).not.toBe(EMPTY_HERO_TEXT_LAYER);
  });
});

describe("updateBlock", () => {
  it("patches only the matching block", () => {
    const layer = addBlock(addBlock(EMPTY_HERO_TEXT_LAYER, "a"), "b");
    const next = updateBlock(layer, "b", { color: "#000000" });
    expect(next.blocks[0].color).toBe("#ffffff");
    expect(next.blocks[1].color).toBe("#000000");
  });
});

describe("removeBlock", () => {
  it("removes the matching block", () => {
    const layer = addBlock(addBlock(EMPTY_HERO_TEXT_LAYER, "a"), "b");
    const next = removeBlock(layer, "a");
    expect(next.blocks.map((b) => b.id)).toEqual(["b"]);
  });
});

describe("duplicateBlock", () => {
  it("copies the source block with a new id, nudged, on top", () => {
    const base = updateBlock(addBlock(EMPTY_HERO_TEXT_LAYER, "a"), "a", {
      xPct: 10,
      yPct: 20,
      content: "Hello",
    });
    const next = duplicateBlock(base, "a", "a-copy");
    expect(next.blocks).toHaveLength(2);
    const copy = next.blocks[1];
    expect(copy.id).toBe("a-copy");
    expect(copy.content).toBe("Hello");
    expect(copy.xPct).toBe(14);
    expect(copy.yPct).toBe(24);
    expect(copy.z).toBe(2);
  });

  it("returns the layer unchanged when the source id is missing", () => {
    const base = addBlock(EMPTY_HERO_TEXT_LAYER, "a");
    expect(duplicateBlock(base, "nope", "x")).toEqual(base);
  });
});

describe("moveBlock", () => {
  it("sets clamped x/y on the matching block", () => {
    const layer = addBlock(EMPTY_HERO_TEXT_LAYER, "a");
    const next = moveBlock(layer, "a", 120, -5);
    expect(next.blocks[0].xPct).toBe(100);
    expect(next.blocks[0].yPct).toBe(0);
  });
});

describe("bringToFront", () => {
  it("gives the block the highest z", () => {
    const layer = addBlock(addBlock(EMPTY_HERO_TEXT_LAYER, "a"), "b");
    const next = bringToFront(layer, "a");
    expect(next.blocks.find((b) => b.id === "a")!.z).toBe(3);
  });
});
