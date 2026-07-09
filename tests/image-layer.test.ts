import { describe, expect, it } from "vitest";
import {
  EMPTY_IMAGE_LAYER,
  normalizeImageLayer,
  addItem,
  updateItem,
  removeItem,
  duplicateItem,
  moveItem,
  bringToFront,
  sendToBack,
  setItemBehind,
  imageItemBoxStyle,
  imageItemFrameStyle,
  imageItemImgStyle,
  MAX_ITEMS_TOTAL,
  canAddItem,
  itemsForSection,
} from "@/lib/image-layer";
import type { ImageItem } from "@/lib/types";

function makeItem(over: Partial<ImageItem> = {}): ImageItem {
  return {
    id: "i1",
    src: "https://example.com/a.png",
    naturalAspect: 1.5,
    xPct: 50,
    yPct: 50,
    widthPct: 40,
    aspect: 1.5,
    rotation: 0,
    flipH: false,
    flipV: false,
    opacity: 1,
    radiusPct: 0,
    blurPx: 0,
    shadow: null,
    crop: { offsetXPct: 50, offsetYPct: 50, zoom: 1 },
    z: 1,
    ...over,
  };
}

describe("normalizeImageLayer", () => {
  it("returns an empty layer for non-objects", () => {
    expect(normalizeImageLayer(null)).toEqual(EMPTY_IMAGE_LAYER);
    expect(normalizeImageLayer(42)).toEqual(EMPTY_IMAGE_LAYER);
  });

  it("drops malformed items and keeps valid ones", () => {
    const layer = normalizeImageLayer({
      items: [{ id: "ok", src: "x" }, { not: "an item" }, null],
    });
    expect(layer.items).toHaveLength(1);
    expect(layer.items[0].id).toBe("ok");
  });

  it("clamps numeric fields and defaults missing ones", () => {
    const layer = normalizeImageLayer({
      items: [
        {
          id: "a",
          src: "x",
          opacity: 5,
          radiusPct: 999,
          blurPx: -3,
          rotation: 999,
          crop: { offsetXPct: 200, offsetYPct: -10, zoom: 0.1 },
        },
      ],
    });
    const it0 = layer.items[0];
    expect(it0.opacity).toBe(1);
    expect(it0.radiusPct).toBe(50);
    expect(it0.blurPx).toBe(0);
    expect(it0.rotation).toBe(180);
    expect(it0.crop.offsetXPct).toBe(100);
    expect(it0.crop.offsetYPct).toBe(0);
    expect(it0.crop.zoom).toBe(1);
    expect(it0.aspect).toBeGreaterThan(0);
  });
});

describe("CRUD helpers", () => {
  const base = { items: [makeItem({ id: "i1", z: 1 })] };

  it("addItem appends with defaults and next z", () => {
    const next = addItem(base, { id: "i2", src: "b", naturalAspect: 2 });
    expect(next.items).toHaveLength(2);
    const added = next.items[1];
    expect(added.aspect).toBe(2);
    expect(added.z).toBe(2);
    expect(added.opacity).toBe(1);
  });

  it("updateItem patches by id", () => {
    const next = updateItem(base, "i1", { opacity: 0.5 });
    expect(next.items[0].opacity).toBe(0.5);
  });

  it("removeItem filters by id", () => {
    expect(removeItem(base, "i1").items).toHaveLength(0);
  });

  it("duplicateItem nudges and raises z", () => {
    const next = duplicateItem(base, "i1", "i1b");
    expect(next.items).toHaveLength(2);
    expect(next.items[1].id).toBe("i1b");
    expect(next.items[1].xPct).toBe(54);
    expect(next.items[1].z).toBe(2);
  });

  it("moveItem sets clamped position", () => {
    const next = moveItem(base, "i1", 120, -10);
    expect(next.items[0].xPct).toBe(120);
    expect(next.items[0].yPct).toBe(-10);
  });

  it("moveItem clamps position to [-50, 150]", () => {
    const next = moveItem(base, "i1", 999, -999);
    expect(next.items[0].xPct).toBe(150);
    expect(next.items[0].yPct).toBe(-50);
  });

  it("bringToFront / sendToBack set extreme z", () => {
    const two = {
      items: [makeItem({ id: "a", z: 1 }), makeItem({ id: "b", z: 5 })],
    };
    expect(bringToFront(two, "a").items[0].z).toBe(6);
    expect(sendToBack(two, "b").items[1].z).toBe(0);
  });

  it("setItemBehind flips z sign while keeping magnitude", () => {
    expect(setItemBehind(base, "i1", true).items[0].z).toBe(-1);
    const behind = setItemBehind(base, "i1", true);
    expect(setItemBehind(behind, "i1", false).items[0].z).toBe(1);
  });
});

describe("style helpers", () => {
  it("box style positions, sizes, rotates and flips", () => {
    const s = imageItemBoxStyle(
      makeItem({
        xPct: 25,
        yPct: 75,
        widthPct: 30,
        aspect: 2,
        rotation: 10,
        flipH: true,
        z: 3,
      }),
    );
    expect(s.left).toBe("25%");
    expect(s.top).toBe("75%");
    expect(s.width).toBe("30%");
    expect(s.aspectRatio).toBe("2");
    expect(s.transform).toBe(
      "translate(-50%, -50%) rotate(10deg) scale(-1, 1)",
    );
    expect(s.zIndex).toBe(3);
  });

  it("frame style applies radius, opacity, blur and shadow", () => {
    const s = imageItemFrameStyle(
      makeItem({
        radiusPct: 12,
        opacity: 0.8,
        blurPx: 4,
        shadow: { x: 2, y: 3, blur: 8, color: "#000" },
      }),
    );
    expect(s.borderRadius).toBe("12%");
    expect(s.opacity).toBe(0.8);
    expect(s.filter).toBe("blur(4px)");
    expect(s.boxShadow).toBe("2px 3px 8px #000");
    expect(s.overflow).toBe("hidden");
  });

  it("img style sets object-fit cover, focal point and zoom", () => {
    const s = imageItemImgStyle(
      makeItem({ crop: { offsetXPct: 30, offsetYPct: 70, zoom: 1.5 } }),
    );
    expect(s.objectFit).toBe("cover");
    expect(s.objectPosition).toBe("30% 70%");
    expect(s.transform).toBe("scale(1.5)");
  });
});

describe("soft cap", () => {
  it("blocks adding past the total cap", () => {
    const items = Array.from({ length: MAX_ITEMS_TOTAL }, (_, i) =>
      makeItem({ id: `t${i}` }),
    );
    expect(canAddItem({ items }).ok).toBe(false);
  });

  it("allows adding under the cap", () => {
    expect(canAddItem({ items: [] }).ok).toBe(true);
  });
});

describe("itemsForSection", () => {
  it("returns items assigned to the requested section", () => {
    const hero = makeItem({ id: "hero" });
    const schedule = makeItem({ id: "schedule", sectionKey: "schedule" });

    expect(itemsForSection({ items: [hero, schedule] }, "schedule")).toEqual([
      schedule,
    ]);
  });

  it("treats legacy items without a section as hero items", () => {
    const legacy = makeItem({ id: "legacy" });
    const schedule = makeItem({ id: "schedule", sectionKey: "schedule" });

    expect(itemsForSection({ items: [legacy, schedule] }, "hero")).toEqual([
      legacy,
    ]);
  });

  it("returns an empty list for missing layers", () => {
    expect(itemsForSection(null, "hero")).toEqual([]);
    expect(itemsForSection(undefined, "hero")).toEqual([]);
  });
});
