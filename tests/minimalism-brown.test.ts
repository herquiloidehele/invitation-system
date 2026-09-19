import { describe, expect, it } from "vitest";
import {
  isMinimalismBrownLayout,
  mbTokens,
  mixWithTransparent,
  buildMonthGrid,
  isGuestbookEnabled,
  resolveWishes,
  contrastRatio,
  resolvePanelForeground,
  idleDelay,
  parallaxOffset,
  autoScrollFrame,
  isUserScroll,
} from "../lib/minimalism-brown";

const theme = {
  primary: "#7C6A60",
  accent: "#C8A97E",
  cardBg: "#FFF7F3",
  textPrimary: "#7C6A60",
  textSecondary: "#918077",
  bodyFont: "'Libre Baskerville', serif",
  ctaPrimaryText: "#DED9D7",
  uiFont: "'Cormorant Garamond', serif",
  sectionTitleFont: "'Libre Baskerville', serif",
} as never;

describe("isMinimalismBrownLayout", () => {
  it("is true only for the minimalism-brown layout", () => {
    expect(isMinimalismBrownLayout({ layout: "minimalism-brown" })).toBe(true);
    expect(isMinimalismBrownLayout({ layout: "elegant-floral" })).toBe(false);
    expect(isMinimalismBrownLayout({ layout: "default" })).toBe(false);
    expect(isMinimalismBrownLayout({})).toBe(false);
  });
});

describe("mixWithTransparent", () => {
  it("builds a color-mix expression at the given percentage", () => {
    expect(mixWithTransparent("#7C6A60", 22)).toBe(
      "color-mix(in srgb, #7C6A60 22%, transparent)",
    );
  });
});

describe("mbTokens", () => {
  it("derives every token from the theme with no undefined leaks", () => {
    const t = mbTokens(theme);
    expect(t.panel.bg).toBe("#7C6A60");
    expect(t.panel.fg).toBe("#DED9D7");
    expect(t.card.bg).toBe("#FFF7F3");
    expect(t.eyebrow.font).toBe("'Cormorant Garamond', serif");
    expect(t.title.font).toBe("'Libre Baskerville', serif");
    expect(JSON.stringify(t)).not.toContain("undefined");
  });

  it("falls back to the body font when sectionTitleFont is unset", () => {
    const t = mbTokens({
      ...(theme as object),
      sectionTitleFont: null,
      bodyFont: "X",
    } as never);
    expect(t.title.font).toBe("X");
  });
});

describe("buildMonthGrid", () => {
  it("lays May 2026 out Monday-first with the wedding day marked", () => {
    const grid = buildMonthGrid("2026-05-16T17:00:00.000Z", 1);
    expect(grid).not.toBeNull();
    expect(grid!.year).toBe(2026);
    expect(grid!.month).toBe(4);
    expect(grid!.weeks[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid!.weeks[0][4]).toEqual({ day: 1, isTarget: false });
    const all = grid!.weeks.flat().filter(Boolean);
    expect(all).toHaveLength(31);
    expect(grid!.weeks.flat().find((c) => c && c.isTarget)).toEqual({
      day: 16,
      isTarget: true,
    });
  });

  it("supports Sunday-first", () => {
    const grid = buildMonthGrid("2026-05-16T00:00:00.000Z", 0);
    expect(grid!.weeks[0].slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid!.weeks[0][5]).toEqual({ day: 1, isTarget: false });
  });

  it("handles a leap-year February", () => {
    const grid = buildMonthGrid("2028-02-29T10:00:00.000Z", 1);
    expect(grid!.weeks.flat().filter(Boolean)).toHaveLength(29);
    expect(grid!.weeks.flat().find((c) => c && c.isTarget)!.day).toBe(29);
  });

  it("pads every week to seven cells", () => {
    const grid = buildMonthGrid("2026-05-16T00:00:00.000Z", 1);
    grid!.weeks.forEach((w) => expect(w).toHaveLength(7));
  });

  it("returns null for an unparseable date", () => {
    expect(buildMonthGrid("not-a-date")).toBeNull();
    expect(buildMonthGrid("")).toBeNull();
  });
});

const wishRows = [
  { id: "a", guestName: "Ana", message: "Parabéns!", submittedAt: new Date("2026-05-01") },
  { id: "b", guestName: "Bruno", message: "   ", submittedAt: new Date("2026-05-02") },
  { id: "c", guestName: "Carla", message: null, submittedAt: new Date("2026-05-03") },
  { id: "d", guestName: "Duarte", message: "Felicidades", submittedAt: new Date("2026-05-04") },
];

describe("isGuestbookEnabled", () => {
  it("defaults to disabled", () => {
    expect(isGuestbookEnabled(null)).toBe(false);
    expect(isGuestbookEnabled(undefined)).toBe(false);
    expect(isGuestbookEnabled({ enabled: false })).toBe(false);
    expect(isGuestbookEnabled({ enabled: true })).toBe(true);
  });
});

describe("resolveWishes", () => {
  it("keeps only non-empty messages, newest first", () => {
    const out = resolveWishes(wishRows, { enabled: true });
    expect(out.map((w) => w.id)).toEqual(["d", "a"]);
    expect(out[0].guestName).toBe("Duarte");
    expect(out[0].message).toBe("Felicidades");
  });

  it("excludes hidden response ids", () => {
    const out = resolveWishes(wishRows, {
      enabled: true,
      hiddenResponseIds: ["d"],
    });
    expect(out.map((w) => w.id)).toEqual(["a"]);
  });

  it("returns nothing when disabled", () => {
    expect(resolveWishes(wishRows, { enabled: false })).toEqual([]);
    expect(resolveWishes(wishRows, null)).toEqual([]);
  });

  it("trims whitespace around a kept message", () => {
    const out = resolveWishes(
      [{ id: "x", guestName: "Eva", message: "  olá  ", submittedAt: new Date() }],
      { enabled: true },
    );
    expect(out[0].message).toBe("olá");
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black on white and 1 for a color on itself", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 4);
    expect(contrastRatio("#7C6A60", "#7C6A60")).toBeCloseTo(1, 4);
  });
  it("parses shorthand hex and rgb()", () => {
    expect(contrastRatio("#fff", "rgb(0, 0, 0)")).toBeCloseTo(21, 4);
  });
  it("returns null when a color can't be parsed", () => {
    expect(contrastRatio("linear-gradient(red, blue)", "#fff")).toBeNull();
  });
});

describe("resolvePanelForeground", () => {
  it("keeps the reference pairing, which clears the AA-large floor", () => {
    expect(
      resolvePanelForeground({ primary: "#7C6A60", ctaPrimaryText: "#DED9D7" }),
    ).toBe("#DED9D7");
  });

  it("corrects a pairing that is illegible at any size", () => {
    expect(
      resolvePanelForeground({ primary: "#F2EDE8", ctaPrimaryText: "#FFFFFF" }),
    ).toBe("#000000");
  });

  it("swaps in a readable foreground when the palette would be unreadable", () => {
    // Pale primary + pale text: the seeded pairing would vanish.
    expect(
      resolvePanelForeground({ primary: "#F2EDE8", ctaPrimaryText: "#FFFFFF" }),
    ).toBe("#000000");
  });

  it("chooses white over black on a dark primary", () => {
    expect(
      resolvePanelForeground({ primary: "#1A1A1A", ctaPrimaryText: "#333333" }),
    ).toBe("#FFFFFF");
  });

  it("leaves an unparseable foreground alone rather than guessing", () => {
    expect(
      resolvePanelForeground({
        primary: "#7C6A60",
        ctaPrimaryText: "var(--brand)",
      }),
    ).toBe("var(--brand)");
  });
});

describe("idleDelay", () => {
  it("spreads offsets across the cycle instead of syncing", () => {
    const delays = [0, 1, 2, 3, 4, 5].map((i) => idleDelay(i, 6));
    expect(new Set(delays).size).toBe(6);
    delays.forEach((d) => {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(6);
    });
  });
  it("is deterministic so server and client agree", () => {
    expect(idleDelay(3, 8)).toBe(idleDelay(3, 8));
  });
  it("handles a bad index", () => {
    expect(idleDelay(-1, 6)).toBe(0);
    expect(idleDelay(NaN, 6)).toBe(0);
  });
});

describe("parallaxOffset", () => {
  it("scales with scroll", () => {
    expect(parallaxOffset(100, 0.2, 80)).toBeCloseTo(20);
  });
  it("clamps in both directions", () => {
    expect(parallaxOffset(10000, 0.2, 80)).toBe(80);
    expect(parallaxOffset(-10000, 0.2, 80)).toBe(-80);
  });
  it("survives a non-finite scroll value", () => {
    expect(parallaxOffset(NaN, 0.2, 80)).toBe(0);
  });
});

describe("autoScrollFrame", () => {
  it("advances by elapsed time, not by frame count", () => {
    const a = autoScrollFrame(1000, { lastMs: 900, lastY: 0 }, 50, 5000);
    expect(a.nextY).toBeCloseTo(5); // 100ms at 50px/s
    expect(a.done).toBe(false);
  });

  it("caps a long gap so returning to a hidden tab doesn't teleport", () => {
    const jump = autoScrollFrame(30000, { lastMs: 0, lastY: 0 }, 50, 5000);
    expect(jump.nextY).toBeCloseTo(5); // 30s clamped to 100ms
  });

  it("stops at the bottom", () => {
    const end = autoScrollFrame(1000, { lastMs: 900, lastY: 4999 }, 50, 5000);
    expect(end.nextY).toBe(5000);
    expect(end.done).toBe(true);
  });

  it("never moves backwards on a clock that goes back", () => {
    const back = autoScrollFrame(500, { lastMs: 900, lastY: 120 }, 50, 5000);
    expect(back.nextY).toBe(120);
  });
});

describe("isUserScroll", () => {
  it("ignores our own write and sub-pixel rounding", () => {
    expect(isUserScroll(200, 200)).toBe(false);
    expect(isUserScroll(202, 200)).toBe(false);
  });
  it("detects a real move in either direction", () => {
    expect(isUserScroll(260, 200)).toBe(true);
    expect(isUserScroll(120, 200)).toBe(true);
  });
});
