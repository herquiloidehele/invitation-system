import { describe, expect, it } from "vitest";

import {
  buildCustomFontCssFamily,
  buildCustomFontFaceCss,
  buildCustomFontStack,
  detectFontFormat,
  extractCustomFontFamilyId,
  normalizeCustomFontName,
  sortFontCatalog,
} from "@/lib/custom-fonts/domain";

describe("custom font domain", () => {
  it("round-trips an immutable custom family token", () => {
    expect(buildCustomFontCssFamily("family-1")).toBe(
      "custom-font-family-1",
    );
    expect(buildCustomFontStack("family-1", "handwriting")).toBe(
      "'custom-font-family-1', cursive",
    );
    expect(
      extractCustomFontFamilyId("'custom-font-family-1', cursive"),
    ).toBe("family-1");
    expect(extractCustomFontFamilyId("'Playfair Display', serif")).toBeNull();
  });

  it("normalizes names for case-insensitive duplicate detection", () => {
    expect(normalizeCustomFontName("  Minha   Fonte ")).toBe("minha fonte");
  });

  it.each([
    ["woff2", [0x77, 0x4f, 0x46, 0x32]],
    ["woff", [0x77, 0x4f, 0x46, 0x46]],
    ["ttf", [0x00, 0x01, 0x00, 0x00]],
    ["otf", [0x4f, 0x54, 0x54, 0x4f]],
  ] as const)("detects %s from bytes", (format, bytes) => {
    expect(detectFontFormat(Uint8Array.from(bytes))).toBe(format);
  });

  it("rejects collections and unknown headers", () => {
    expect(() =>
      detectFontFormat(Uint8Array.from([0x74, 0x74, 0x63, 0x66])),
    ).toThrow("Font collections are not supported");
    expect(() => detectFontFormat(Uint8Array.from([1, 2, 3, 4]))).toThrow(
      "Unsupported font format",
    );
  });

  it("puts active custom families before built-ins and Google fonts", () => {
    const sorted = sortFontCatalog([
      {
        source: "google",
        family: "Lato",
        category: "sans-serif",
        value: "'Lato', sans-serif",
        builtin: false,
      },
      {
        source: "custom",
        id: "f1",
        family: "Atelier",
        category: "display",
        value: "'custom-font-f1', serif",
        archived: false,
        variants: [],
      },
      {
        source: "builtin",
        family: "Inter",
        category: "sans-serif",
        value: "'Inter', sans-serif",
        builtin: true,
      },
    ]);

    expect(sorted.map((font) => font.source)).toEqual([
      "custom",
      "builtin",
      "google",
    ]);
  });

  it("builds one revisioned face per variant", () => {
    const css = buildCustomFontFaceCss({
      id: "f1",
      cssFamily: "custom-font-f1",
      fallbackCategory: "display",
      revision: 4,
      variants: [
        {
          id: "v1",
          weight: 400,
          style: "normal",
          format: "woff2",
          revision: 2,
          url: "/api/fonts/files/v1?v=2",
        },
        {
          id: "v2",
          weight: 700,
          style: "italic",
          format: "otf",
          revision: 1,
          url: "/api/fonts/files/v2?v=1",
        },
      ],
    });

    expect(css).toContain("font-family: 'custom-font-f1'");
    expect(css).toContain("font-weight: 400");
    expect(css).toContain("font-style: italic");
    expect(css).toContain("format('opentype')");
    expect(css.match(/@font-face/g)).toHaveLength(2);
  });
});
