import { describe, expect, it } from "vitest";

import { mergeGiftItems, pickLocaleValue } from "@/lib/ai-platform";

describe("pickLocaleValue", () => {
  const map = { pt: "Confirmar", en: "RSVP" };

  it("returns the active-locale value", () => {
    expect(pickLocaleValue(map, "en", "pt")).toBe("RSVP");
  });

  it("falls back to the fallback locale when the active one is absent", () => {
    expect(pickLocaleValue(map, "es", "pt")).toBe("Confirmar");
  });

  it("falls back to the first present value when neither matches", () => {
    expect(pickLocaleValue({ de: "Hallo" }, "es", "pt")).toBe("Hallo");
  });

  it("returns an empty string for an empty map", () => {
    expect(pickLocaleValue({}, "pt", "pt")).toBe("");
  });
});

describe("mergeGiftItems", () => {
  const items = [
    { id: "g1", name: "Blender" },
    { id: "g2", name: "Kettle" },
    { id: "g3", name: "Towels" },
  ];

  it("annotates each item with its availability status", () => {
    const merged = mergeGiftItems(items, [
      { giftItemId: "g2", status: "reserved" },
      { giftItemId: "g3", status: "owned" },
    ]);
    expect(merged.map((m) => [m.id, m.status])).toEqual([
      ["g1", "available"],
      ["g2", "reserved"],
      ["g3", "owned"],
    ]);
  });

  it("defaults to available when an item has no availability row", () => {
    expect(mergeGiftItems([{ id: "g1", name: "Blender" }], [])[0].status).toBe(
      "available",
    );
  });

  it("preserves item order and returns [] for no items", () => {
    expect(mergeGiftItems([], [{ giftItemId: "x", status: "reserved" }])).toEqual(
      [],
    );
  });
});
