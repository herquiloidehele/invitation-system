import { describe, expect, it } from "vitest";

import {
  classifyFontFamily,
  customFontLoadKey,
  uniqueCustomFontIds,
} from "@/hooks/useDynamicFont";

describe("dynamic custom font classification", () => {
  it("classifies built-in, Google, and custom stacks", () => {
    expect(classifyFontFamily("'Outfit', sans-serif")).toEqual({
      source: "builtin",
      family: "Outfit",
    });
    expect(classifyFontFamily("'Lobster', cursive")).toEqual({
      source: "google",
      family: "Lobster",
    });
    expect(classifyFontFamily("'custom-font-family-1', serif")).toEqual({
      source: "custom",
      family: "custom-font-family-1",
      id: "family-1",
    });
  });

  it("deduplicates custom family IDs across repeated stacks", () => {
    expect(
      uniqueCustomFontIds([
        "'custom-font-family-1', serif",
        "'custom-font-family-1', serif",
        "'Lobster', cursive",
      ]),
    ).toEqual(["family-1"]);
  });

  it("changes its load key when a family or variant revision changes", () => {
    const manifest = {
      id: "family-1",
      cssFamily: "custom-font-family-1",
      fallbackCategory: "display" as const,
      revision: 3,
      variants: [
        {
          id: "variant-1",
          weight: 400,
          style: "normal" as const,
          format: "woff2" as const,
          revision: 2,
          url: "/api/fonts/files/variant-1?v=2",
        },
      ],
    };

    expect(customFontLoadKey(manifest)).not.toBe(
      customFontLoadKey({
        ...manifest,
        variants: [{ ...manifest.variants[0], revision: 3 }],
      }),
    );
  });
});
