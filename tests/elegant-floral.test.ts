import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isElegantFloralLayout,
  resolveLocationPhotos,
  wrapCarouselIndex,
  countdownPartsFrom,
  efPageBackgroundStyle,
  EF_BACKGROUND_PATTERN,
  EF_BACKGROUND_TILE_WIDTH,
  efGuestGuideCardStyle,
} from "../lib/elegant-floral";

describe("isElegantFloralLayout", () => {
  it("is true only for the elegant-floral layout", () => {
    expect(isElegantFloralLayout({ layout: "elegant-floral" })).toBe(true);
    expect(isElegantFloralLayout({ layout: "default" })).toBe(false);
    expect(isElegantFloralLayout({ layout: "curtain-canva" })).toBe(false);
    expect(isElegantFloralLayout({})).toBe(false);
  });
});

describe("resolveLocationPhotos", () => {
  it("returns the photos array when present and non-empty", () => {
    const photos = [{ src: "a.jpg" }, { src: "b.jpg" }];
    expect(resolveLocationPhotos({ photos })).toEqual(photos);
  });
  it("falls back to a single-item list from imageUrl", () => {
    expect(resolveLocationPhotos({ imageUrl: "legacy.jpg" })).toEqual([
      { src: "legacy.jpg" },
    ]);
  });
  it("drops blank-src photos and falls back to imageUrl", () => {
    expect(
      resolveLocationPhotos({
        photos: [{ src: "  " }],
        imageUrl: "legacy.jpg",
      }),
    ).toEqual([{ src: "legacy.jpg" }]);
  });
  it("returns [] when nothing is set", () => {
    expect(resolveLocationPhotos({})).toEqual([]);
    expect(resolveLocationPhotos(null)).toEqual([]);
  });
});

describe("wrapCarouselIndex", () => {
  it("wraps within range in both directions", () => {
    expect(wrapCarouselIndex(0, 3)).toBe(0);
    expect(wrapCarouselIndex(3, 3)).toBe(0);
    expect(wrapCarouselIndex(-1, 3)).toBe(2);
    expect(wrapCarouselIndex(4, 3)).toBe(1);
  });
  it("returns 0 for empty length", () => {
    expect(wrapCarouselIndex(2, 0)).toBe(0);
  });
});

describe("countdownPartsFrom", () => {
  it("splits remaining time into parts", () => {
    const now = Date.parse("2026-08-14T16:00:00Z");
    const r = countdownPartsFrom("2026-08-15T16:00:00Z", now);
    expect(r).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: false,
    });
  });
  it("clamps to zero/done once the target has passed", () => {
    const now = Date.parse("2026-08-16T00:00:00Z");
    expect(countdownPartsFrom("2026-08-15T16:00:00Z", now).done).toBe(true);
  });
  it("returns done for an unparseable date", () => {
    expect(countdownPartsFrom("not-a-date", 0).done).toBe(true);
  });
});

describe("efPageBackgroundStyle", () => {
  it("layers the damask tile over the theme's background colour", () => {
    const style = efPageBackgroundStyle({ bg: "#FFFDF7" });
    expect(style.backgroundColor).toBe("#FFFDF7");
    expect(style.backgroundImage).toBe(`url(${EF_BACKGROUND_PATTERN})`);
  });

  it("tiles at a fixed width so the damask keeps one scale on every viewport", () => {
    const style = efPageBackgroundStyle({ bg: "#FFFDF7" });
    expect(style.backgroundRepeat).toBe("repeat");
    expect(style.backgroundSize).toBe(`${EF_BACKGROUND_TILE_WIDTH}px auto`);
  });

  it("uses an uploaded background image in place of the damask", () => {
    const style = efPageBackgroundStyle(
      { bg: "#FFFDF7" },
      "https://cdn.example.com/custom-pattern.webp",
    );
    expect(style.backgroundImage).toBe(
      "url(https://cdn.example.com/custom-pattern.webp)",
    );
  });

  it("tiles an uploaded image exactly like the damask it replaces", () => {
    const style = efPageBackgroundStyle(
      { bg: "#FFFDF7" },
      "/uploads/mine.webp",
    );
    expect(style.backgroundRepeat).toBe("repeat");
    expect(style.backgroundSize).toBe(`${EF_BACKGROUND_TILE_WIDTH}px auto`);
    expect(style.backgroundColor).toBe("#FFFDF7");
  });

  it("falls back to the damask when the upload is absent or blank", () => {
    const damask = `url(${EF_BACKGROUND_PATTERN})`;
    expect(efPageBackgroundStyle({ bg: "#FFFDF7" }).backgroundImage).toBe(
      damask,
    );
    expect(
      efPageBackgroundStyle({ bg: "#FFFDF7" }, undefined).backgroundImage,
    ).toBe(damask);
    expect(efPageBackgroundStyle({ bg: "#FFFDF7" }, "").backgroundImage).toBe(
      damask,
    );
    expect(
      efPageBackgroundStyle({ bg: "#FFFDF7" }, "   ").backgroundImage,
    ).toBe(damask);
  });

  it("points at an asset that actually ships in public/", () => {
    expect(
      existsSync(join(process.cwd(), "public", EF_BACKGROUND_PATTERN)),
    ).toBe(true);
  });

  it("keeps the original artwork so the tile can be re-derived", () => {
    expect(
      existsSync(
        join(
          process.cwd(),
          "public/images/themes/elegant-floral/damask-source.webp",
        ),
      ),
    ).toBe(true);
  });
});

describe("efGuestGuideCardStyle", () => {
  const theme = { secondary: "#C9A962" };

  it("defaults to the translucent wash so the damask reads through", () => {
    const s = efGuestGuideCardStyle(theme);
    expect(s.cardBg).toBe("color-mix(in srgb, #C9A962 8%, transparent)");
    expect(s.cardBorder).toBe("color-mix(in srgb, #C9A962 28%, transparent)");
    expect(s.plain).toBe(false);
  });

  it("lets a per-invitation override win over the layout default", () => {
    const s = efGuestGuideCardStyle(theme, {
      cardBg: "#FFF",
      cardBorder: "#000",
    });
    expect(s.cardBg).toBe("#FFF");
    expect(s.cardBorder).toBe("#000");
  });

  it("only turns plain on for an explicit true", () => {
    expect(efGuestGuideCardStyle(theme, { plain: true }).plain).toBe(true);
    expect(efGuestGuideCardStyle(theme, { plain: false }).plain).toBe(false);
    expect(efGuestGuideCardStyle(theme, {}).plain).toBe(false);
    expect(efGuestGuideCardStyle(theme, null).plain).toBe(false);
  });
});

describe("elegant-floral guest guide wiring", () => {
  const page = readFileSync(
    "components/elegant-floral/ElegantFloralPage.tsx",
    "utf8",
  );

  it("renders the shared guest-guide section behind the enabled flag", () => {
    expect(page).toContain("invitation.guestGuide?.enabled");
    expect(page).toContain("<GuestGuideSection");
  });

  it("titles it from the host-renameable custom text", () => {
    expect(page).toContain('ct("sectionTitle_guestGuide")');
  });

  it("places it between the gifts and FAQ sections", () => {
    const gifts = page.indexOf("<GiftsSection");
    const guide = page.indexOf("<GuestGuideSection");
    const faq = page.indexOf("<FaqSection");
    expect(gifts).toBeGreaterThan(-1);
    expect(guide).toBeGreaterThan(gifts);
    expect(faq).toBeGreaterThan(guide);
  });
});
