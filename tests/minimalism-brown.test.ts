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
  readableOn,
  idleDelay,
  parallaxOffset,
  mbVenues,
  resolveMbHeroMode,
  mbCoupleNames,
  mbParentsShown,
  mbBlessingLine,
  mbCalendarDetail,
  mbTransport,
  mbWebLink,
  mbGuestPhotoUpload,
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

describe("readableOn", () => {
  it("returns the first candidate that clears AA", () => {
    expect(readableOn("#C8A97E", ["#F5F1EF", "#7C6A60", "#3B322C"])).toBe(
      "#3B322C",
    );
  });

  it("keeps an early candidate when it already reads", () => {
    expect(readableOn("#7C6A60", ["#F5F1EF", "#000000"])).toBe("#F5F1EF");
  });

  it("falls back to the highest contrast when none clears AA", () => {
    // Both are near-white on white; neither passes, so the darker wins.
    expect(readableOn("#FFFFFF", ["#FAFAFA", "#E0E0E0"])).toBe("#E0E0E0");
  });

  it("ignores candidates it cannot parse", () => {
    expect(readableOn("#FFFFFF", ["var(--x)", "#000000"])).toBe("#000000");
  });
});

describe("mbVenues", () => {
  const church = { name: "Igreja", address: "Largo", googleMapsUrl: "" };
  const quinta = { name: "Quinta", address: "Estrada", googleMapsUrl: "" };

  it("returns both locations in order when a second one is set", () => {
    expect(mbVenues({ location: church, location2: quinta })).toEqual([
      church,
      quinta,
    ]);
  });

  it("returns only the first location when there is no second", () => {
    expect(mbVenues({ location: church })).toEqual([church]);
  });

  it("skips a location with no name", () => {
    expect(
      mbVenues({ location: { ...church, name: "  " }, location2: quinta }),
    ).toEqual([quinta]);
  });
});

describe("resolveMbHeroMode", () => {
  it("uses the polaroid photo hero when there is no video", () => {
    expect(resolveMbHeroMode({})).toBe("polaroid-photo");
    expect(resolveMbHeroMode({ videoUrl: "  " })).toBe("polaroid-photo");
    expect(resolveMbHeroMode({ videoUrl: "", heroVideoInFrame: true })).toBe(
      "polaroid-photo",
    );
  });

  it("keeps the full-screen video hero unless the frame toggle is on", () => {
    expect(resolveMbHeroMode({ videoUrl: "https://x/v.mp4" })).toBe(
      "fullscreen-video",
    );
    expect(
      resolveMbHeroMode({
        videoUrl: "https://x/v.mp4",
        heroVideoInFrame: false,
      }),
    ).toBe("fullscreen-video");
  });

  it("plays the video inside the polaroid when the toggle is on", () => {
    expect(
      resolveMbHeroMode({
        videoUrl: "https://x/v.mp4",
        heroVideoInFrame: true,
      }),
    ).toBe("polaroid-video");
  });
});

describe("mbCoupleNames", () => {
  const couple = { bride: "Constança", groom: "Rodrigo", monogram: "CR" };

  it("puts the first name field (the bride) first, as the rest of the platform does", () => {
    expect(mbCoupleNames({ couple, eventType: "wedding" })).toEqual([
      "Constança",
      "Rodrigo",
    ]);
  });

  it("shows only the primary name for a single-honouree event", () => {
    expect(mbCoupleNames({ couple, eventType: "baptism" })).toEqual([
      "Constança",
    ]);
  });
});

const parents = {
  enabled: true,
  blessingMessage: "Com a bênção de Deus e seus pais",
  inviteMessage: "Convidam para a celebração do seu casamento",
  bridesFather: "Henrique",
  bridesMother: "",
  groomsFather: "",
  groomsMother: "",
};

describe("mbParentsShown", () => {
  it("shows the parents when the mode is on and a name is filled in", () => {
    expect(mbParentsShown(parents)).toBe(true);
  });

  it("hides them when the mode is off, even with names stored", () => {
    expect(mbParentsShown({ ...parents, enabled: false })).toBe(false);
  });

  it("hides them when the mode is on but every name is blank", () => {
    expect(mbParentsShown({ ...parents, bridesFather: "  " })).toBe(false);
    expect(mbParentsShown(undefined)).toBe(false);
  });
});

describe("mbBlessingLine", () => {
  const fallback = "Com a bênção de Deus";

  it("uses the parents' blessing when parents mode is on", () => {
    expect(mbBlessingLine(parents, fallback)).toBe(
      "Com a bênção de Deus e seus pais",
    );
  });

  it("uses the section title when parents mode is off", () => {
    expect(mbBlessingLine({ ...parents, enabled: false }, fallback)).toBe(
      fallback,
    );
    expect(mbBlessingLine(undefined, fallback)).toBe(fallback);
  });

  it("falls back to the section title when the blessing is blank", () => {
    expect(mbBlessingLine({ ...parents, blessingMessage: " " }, fallback)).toBe(
      fallback,
    );
  });

  it("is null when there is no text at all", () => {
    expect(mbBlessingLine({ ...parents, enabled: false }, "  ")).toBeNull();
  });
});

describe("mbCalendarDetail", () => {
  it("returns the free-text description, trimmed", () => {
    expect(mbCalendarDetail({ mb_calendarDetail: " Quinta da Alegria " })).toBe(
      "Quinta da Alegria",
    );
  });

  it("is null when blank or unset, so the line is hidden", () => {
    expect(mbCalendarDetail({ mb_calendarDetail: "  " })).toBeNull();
    expect(mbCalendarDetail({})).toBeNull();
    expect(mbCalendarDetail(undefined)).toBeNull();
  });
});

describe("mbTransport", () => {
  const info = {
    enabled: true,
    imageUrl: "https://cdn.example.com/bus.png",
    imageSize: "small" as const,
    title: " Transporte ",
    description: " Autocarro às 14h\nRegresso às 02h ",
  };

  it("returns the trimmed block when the section is on", () => {
    expect(mbTransport({ transportInfo: info })).toEqual({
      imageUrl: "https://cdn.example.com/bus.png",
      imageWidth: "40%",
      title: "Transporte",
      description: "Autocarro às 14h\nRegresso às 02h",
    });
  });

  it("is null when the section is off or unset", () => {
    expect(mbTransport({ transportInfo: { ...info, enabled: false } })).toBeNull();
    expect(mbTransport({ transportInfo: undefined })).toBeNull();
    expect(mbTransport({})).toBeNull();
  });

  it("is null when it is on but has nothing to show", () => {
    expect(
      mbTransport({
        transportInfo: { enabled: true, imageUrl: " ", title: " ", description: "" },
      }),
    ).toBeNull();
  });

  it("shows with an image alone", () => {
    expect(
      mbTransport({
        transportInfo: {
          enabled: true,
          imageUrl: "https://cdn.example.com/bus.png",
          title: "",
          description: "",
        },
      }),
    ).toMatchObject({ imageUrl: "https://cdn.example.com/bus.png", title: "" });
  });

  it("sizes the image from the admin's choice, medium by default", () => {
    const width = (imageSize?: unknown) =>
      mbTransport({ transportInfo: { ...info, imageSize: imageSize as never } })
        ?.imageWidth;

    expect(width("small")).toBe("40%");
    expect(width("medium")).toBe("70%");
    expect(width("full")).toBe("100%");
    expect(width(undefined)).toBe("70%");
    expect(width("huge")).toBe("70%");
  });
});

describe("mbWebLink", () => {
  it("keeps a full web link as typed", () => {
    expect(mbWebLink(" https://photos.app.goo.gl/abc123 ")).toBe(
      "https://photos.app.goo.gl/abc123",
    );
    expect(mbWebLink("http://example.com/album?x=1")).toBe(
      "http://example.com/album?x=1",
    );
  });

  it("adds https to a link typed without it", () => {
    expect(mbWebLink("photos.app.goo.gl/abc123")).toBe(
      "https://photos.app.goo.gl/abc123",
    );
  });

  it("is null for anything that is not a web link", () => {
    expect(mbWebLink("javascript:alert(1)")).toBeNull();
    expect(mbWebLink("mailto:ana@example.com")).toBeNull();
    expect(mbWebLink("as minhas fotos")).toBeNull();
    expect(mbWebLink("fotos")).toBeNull();
    expect(mbWebLink("  ")).toBeNull();
    expect(mbWebLink(undefined)).toBeNull();
  });
});

describe("mbGuestPhotoUpload", () => {
  const upload = {
    enabled: true,
    url: "photos.app.goo.gl/abc123",
    text: " Partilhem connosco as vossas fotos!\nObrigado. ",
  };

  it("returns the cleaned link and trimmed text when it is on", () => {
    expect(mbGuestPhotoUpload({ guestPhotoUpload: upload })).toEqual({
      href: "https://photos.app.goo.gl/abc123",
      text: "Partilhem connosco as vossas fotos!\nObrigado.",
    });
  });

  it("is null when it is off or unset", () => {
    expect(
      mbGuestPhotoUpload({ guestPhotoUpload: { ...upload, enabled: false } }),
    ).toBeNull();
    expect(mbGuestPhotoUpload({ guestPhotoUpload: undefined })).toBeNull();
    expect(mbGuestPhotoUpload({})).toBeNull();
  });

  it("is null without a usable link, so no dead button is published", () => {
    expect(
      mbGuestPhotoUpload({ guestPhotoUpload: { ...upload, url: " " } }),
    ).toBeNull();
    expect(
      mbGuestPhotoUpload({
        guestPhotoUpload: { ...upload, url: "javascript:alert(1)" },
      }),
    ).toBeNull();
  });

  it("shows the button alone when there is no text", () => {
    expect(
      mbGuestPhotoUpload({ guestPhotoUpload: { ...upload, text: "" } }),
    ).toEqual({ href: "https://photos.app.goo.gl/abc123", text: "" });
  });
});
