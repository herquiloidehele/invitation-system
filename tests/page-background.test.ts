import { describe, expect, it } from "vitest";
import {
  pageBackgroundStyle,
  UPLOADED_BACKGROUND_SIZE,
} from "../lib/page-background";
import {
  EF_PAGE_BACKGROUND,
  EF_BACKGROUND_PATTERN,
  EF_BACKGROUND_TILE_WIDTH,
} from "../lib/elegant-floral";

const THEME = { bg: "#FFFDF7" };

describe("pageBackgroundStyle without a bundled fallback", () => {
  // This is the guarantee that shipped invitations on every other layout keep
  // rendering exactly as they did before the upload existed.
  it("paints the theme colour and nothing else when there is no upload", () => {
    const style = pageBackgroundStyle(THEME);
    expect(style.backgroundColor).toBe("#FFFDF7");
    expect(style.backgroundImage).toBeUndefined();
    expect(style.backgroundRepeat).toBeUndefined();
    expect(style.backgroundSize).toBeUndefined();
  });

  it("stays bare for a blank or whitespace-only upload", () => {
    expect(pageBackgroundStyle(THEME, "").backgroundImage).toBeUndefined();
    expect(pageBackgroundStyle(THEME, "   ").backgroundImage).toBeUndefined();
    expect(pageBackgroundStyle(THEME, null).backgroundImage).toBeUndefined();
  });

  it("tiles an upload across the column width, repeating down the page", () => {
    const style = pageBackgroundStyle(THEME, "/uploads/mine.webp");
    expect(style.backgroundImage).toBe("url(/uploads/mine.webp)");
    expect(style.backgroundRepeat).toBe("repeat");
    expect(style.backgroundSize).toBe(UPLOADED_BACKGROUND_SIZE);
    expect(style.backgroundColor).toBe("#FFFDF7");
  });
});

describe("pageBackgroundStyle with a bundled fallback", () => {
  it("uses the fallback pattern at its own tuned tile width", () => {
    const style = pageBackgroundStyle(THEME, undefined, EF_PAGE_BACKGROUND);
    expect(style.backgroundImage).toBe(`url(${EF_BACKGROUND_PATTERN})`);
    expect(style.backgroundSize).toBe(`${EF_BACKGROUND_TILE_WIDTH}px auto`);
    expect(style.backgroundRepeat).toBe("repeat");
  });

  it("falls back for a blank upload rather than leaving the page bare", () => {
    const damask = `url(${EF_BACKGROUND_PATTERN})`;
    expect(
      pageBackgroundStyle(THEME, "", EF_PAGE_BACKGROUND).backgroundImage,
    ).toBe(damask);
    expect(
      pageBackgroundStyle(THEME, "  ", EF_PAGE_BACKGROUND).backgroundImage,
    ).toBe(damask);
  });

  it("an upload overrides the fallback and takes the upload tile size", () => {
    const style = pageBackgroundStyle(
      THEME,
      "https://cdn.example.com/custom.webp",
      EF_PAGE_BACKGROUND,
    );
    expect(style.backgroundImage).toBe(
      "url(https://cdn.example.com/custom.webp)",
    );
    // The tuned 840px belongs to the damask artwork, not to the layout, so an
    // upload must not inherit it.
    expect(style.backgroundSize).toBe(UPLOADED_BACKGROUND_SIZE);
  });
});
