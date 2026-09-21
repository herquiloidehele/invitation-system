import { describe, expect, it } from "vitest";
import {
  pageBackgroundStyle,
  UPLOADED_BACKGROUND_SIZE,
} from "../lib/page-background";

const THEME = { bg: "#FFFDF7" };

describe("pageBackgroundStyle", () => {
  // No layout bundles a pattern: a page is bare unless the host uploads one.
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
