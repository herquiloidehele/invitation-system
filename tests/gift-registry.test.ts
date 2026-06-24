import { describe, expect, it } from "vitest";

import { giftsPagePath, hasGiftItems } from "@/lib/gift-registry";
import type { GiftItem } from "@/lib/types";

const item = (over: Partial<GiftItem> = {}): GiftItem => ({
  id: "gift-1",
  name: "Jogo de panelas",
  ...over,
});

describe("hasGiftItems", () => {
  it("is false when the registry is null/undefined", () => {
    expect(hasGiftItems(null)).toBe(false);
    expect(hasGiftItems(undefined)).toBe(false);
  });

  it("is false when items is missing or empty", () => {
    expect(hasGiftItems({})).toBe(false);
    expect(hasGiftItems({ items: [] })).toBe(false);
  });

  it("is true when at least one item exists", () => {
    expect(hasGiftItems({ items: [item()] })).toBe(true);
  });
});

describe("giftsPagePath", () => {
  it("builds the path without a guest token", () => {
    expect(giftsPagePath("joao-maria")).toBe("/joao-maria/gifts");
  });

  it("appends and URL-encodes the guest token", () => {
    expect(giftsPagePath("joao-maria", "abc 123")).toBe(
      "/joao-maria/gifts?g=abc%20123",
    );
  });

  it("ignores a null/empty token", () => {
    expect(giftsPagePath("joao-maria", null)).toBe("/joao-maria/gifts");
    expect(giftsPagePath("joao-maria", "")).toBe("/joao-maria/gifts");
  });
});
