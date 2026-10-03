import { describe, expect, it } from "vitest";

import {
  resolveRsvpPageStyle,
  sanitizeRsvpPageStyle,
  type RsvpPageThemeSource,
} from "@/lib/rsvp-page-style";

const theme: RsvpPageThemeSource = {
  bg: "#101820",
  cardBg: "#1B2631",
  cardBorder: "#2E4053",
  textPrimary: "#F4EFE6",
  textSecondary: "#D5CBB8",
  textMuted: "#9A8F7C",
  accent: "#C9A227",
  ctaPrimaryBg: "#C9A227",
  ctaPrimaryText: "#101820",
  ctaRadius: "999px",
  displayFont: "'Cormorant Garamond', serif",
  uiFont: "'Jost', sans-serif",
};

// Today's hardcoded /confirmar page, token for token.
const LEGACY = {
  layout: "classic",
  colors: {
    pageBg: "#F9F8F6",
    cardBg: "#FFFFFF",
    border: "#E6E4E0",
    title: "#2C2C2B",
    text: "#6B6A68",
    muted: "#A5A39F",
    accent: "#BE8C7A",
    buttonBg: "#2C2C2B",
    buttonText: "#FFFFFF",
    fieldBg: "#F4F3F0",
    fieldText: "#2C2C2B",
    fieldPlaceholder: "#A5A39F",
    fieldBorder: "#E6E4E0",
  },
  fonts: {
    title: "'Georgia', 'Times New Roman', serif",
    body: "'Inter', system-ui, sans-serif",
  },
  radius: { card: "16px", button: "10px" },
  cardBorder: true,
  shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  fieldStyle: "default",
  hasCustomFieldBackground: false,
  header: { showEyebrow: true, showDate: true, showMonogram: false },
};

describe("resolveRsvpPageStyle — legacy neutral page", () => {
  it("reproduces today's page when nothing is stored", () => {
    expect(
      resolveRsvpPageStyle({ config: null, theme, rsvp: {} }),
    ).toEqual(LEGACY);
  });

  it("treats { base: 'neutral' } exactly like no config", () => {
    expect(
      resolveRsvpPageStyle({ config: { base: "neutral" }, theme, rsvp: {} }),
    ).toEqual(resolveRsvpPageStyle({ config: undefined, theme, rsvp: {} }));
  });

  it("keeps honouring the shared rsvp field settings", () => {
    const tokens = resolveRsvpPageStyle({
      config: null,
      theme,
      rsvp: {
        inputStyle: "soft",
        inputBackgroundColor: "#ffffff",
        inputBorderColor: "  ",
        backgroundImageUrl: "https://cdn.example.com/bg.jpg",
      },
    });
    expect(tokens.fieldStyle).toBe("soft");
    expect(tokens.colors.fieldBg).toBe("#ffffff");
    expect(tokens.colors.fieldBorder).toBe("#E6E4E0");
    expect(tokens.hasCustomFieldBackground).toBe(true);
    expect(tokens.backgroundImageUrl).toBe("https://cdn.example.com/bg.jpg");
  });
});

describe("resolveRsvpPageStyle — theme base", () => {
  it("maps every token from the theme", () => {
    const tokens = resolveRsvpPageStyle({
      config: { base: "theme" },
      theme,
      rsvp: {},
    });
    expect(tokens.colors).toEqual({
      pageBg: "#101820",
      cardBg: "#1B2631",
      border: "#2E4053",
      title: "#F4EFE6",
      text: "#D5CBB8",
      muted: "#9A8F7C",
      accent: "#C9A227",
      buttonBg: "#C9A227",
      buttonText: "#101820",
      fieldBg: "color-mix(in srgb, #F4EFE6 5%, #1B2631)",
      fieldText: "#F4EFE6",
      fieldPlaceholder: "#9A8F7C",
      fieldBorder: "#2E4053",
    });
    expect(tokens.fonts).toEqual({
      title: "'Cormorant Garamond', serif",
      body: "'Jost', sans-serif",
    });
    expect(tokens.radius).toEqual({ card: "16px", button: "999px" });
  });

  it("falls back to the neutral accent when the theme accent is not #rrggbb", () => {
    const tokens = resolveRsvpPageStyle({
      config: { base: "theme" },
      theme: { ...theme, accent: "rgba(201,162,39,0.8)" },
      rsvp: {},
    });
    expect(tokens.colors.accent).toBe("#BE8C7A");
  });

  it("falls back to the neutral base when no theme is available", () => {
    expect(
      resolveRsvpPageStyle({ config: { base: "theme" }, theme: null, rsvp: {} }),
    ).toEqual(LEGACY);
  });
});

describe("resolveRsvpPageStyle — overrides", () => {
  it("applies colour and font overrides on top of the base", () => {
    const tokens = resolveRsvpPageStyle({
      config: {
        base: "theme",
        colors: { pageBg: "#FFFFFF", accent: "#AA3355" },
        fonts: { title: "'Great Vibes', cursive" },
      },
      theme,
      rsvp: {},
    });
    expect(tokens.colors.pageBg).toBe("#FFFFFF");
    expect(tokens.colors.accent).toBe("#AA3355");
    expect(tokens.colors.cardBg).toBe("#1B2631");
    expect(tokens.fonts).toEqual({
      title: "'Great Vibes', cursive",
      body: "'Jost', sans-serif",
    });
  });

  it("ignores invalid stored overrides", () => {
    const tokens = resolveRsvpPageStyle({
      config: { base: "theme", colors: { title: "red" } },
      theme,
      rsvp: {},
    });
    expect(tokens.colors.title).toBe("#F4EFE6");
  });

  it("derives field tokens from overridden page colours", () => {
    const tokens = resolveRsvpPageStyle({
      config: {
        base: "neutral",
        colors: {
          cardBg: "#000000",
          title: "#FFFFFF",
          muted: "#777777",
          border: "#333333",
        },
      },
      theme,
      rsvp: {},
    });
    expect(tokens.colors.fieldBg).toBe(
      "color-mix(in srgb, #FFFFFF 5%, #000000)",
    );
    expect(tokens.colors.fieldText).toBe("#FFFFFF");
    expect(tokens.colors.fieldPlaceholder).toBe("#777777");
    expect(tokens.colors.fieldBorder).toBe("#333333");
  });

  it("lets the shared rsvp.input* colours win over derived field tokens", () => {
    const tokens = resolveRsvpPageStyle({
      config: { base: "theme" },
      theme,
      rsvp: { inputTextColor: "#123456", inputPlaceholderColor: "#654321" },
    });
    expect(tokens.colors.fieldText).toBe("#123456");
    expect(tokens.colors.fieldPlaceholder).toBe("#654321");
    expect(tokens.colors.fieldBg).toBe(
      "color-mix(in srgb, #F4EFE6 5%, #1B2631)",
    );
  });

  it("applies the radius presets and pins the button radius", () => {
    const radius = (preset: "square" | "soft" | "round") =>
      resolveRsvpPageStyle({
        config: { base: "theme", shape: { radius: preset } },
        theme,
        rsvp: {},
      }).radius;
    expect(radius("square")).toEqual({ card: "0px", field: "0px", button: "0px" });
    expect(radius("soft")).toEqual({ card: "12px", field: "8px", button: "8px" });
    expect(radius("round")).toEqual({ card: "24px", field: "16px", button: "999px" });
  });

  it("applies the border and shadow options", () => {
    const tokens = resolveRsvpPageStyle({
      config: { base: "neutral", shape: { border: false, shadow: "strong" } },
      theme,
      rsvp: {},
    });
    expect(tokens.cardBorder).toBe(false);
    expect(tokens.shadow).toBe("0 18px 40px -12px rgb(0 0 0 / 0.18)");
    expect(
      resolveRsvpPageStyle({
        config: { base: "neutral", shape: { shadow: "none" } },
        theme,
        rsvp: {},
      }).shadow,
    ).toBe("none");
  });

  it("defaults the monogram on for the editorial layout only", () => {
    const header = (layout: "classic" | "minimal" | "editorial") =>
      resolveRsvpPageStyle({ config: { base: "theme", layout }, theme, rsvp: {} })
        .header;
    expect(header("classic").showMonogram).toBe(false);
    expect(header("minimal").showMonogram).toBe(false);
    expect(header("editorial").showMonogram).toBe(true);
    expect(
      resolveRsvpPageStyle({
        config: {
          base: "theme",
          layout: "editorial",
          header: {
            showMonogram: false,
            showDate: false,
            imageUrl: "https://cdn.example.com/top.jpg",
          },
        },
        theme,
        rsvp: {},
      }).header,
    ).toEqual({
      showEyebrow: true,
      showDate: false,
      showMonogram: false,
      imageUrl: "https://cdn.example.com/top.jpg",
    });
  });
});

describe("sanitizeRsvpPageStyle", () => {
  it("returns undefined without a valid base", () => {
    expect(sanitizeRsvpPageStyle(null)).toBeUndefined();
    expect(sanitizeRsvpPageStyle("theme")).toBeUndefined();
    expect(sanitizeRsvpPageStyle({})).toBeUndefined();
    expect(sanitizeRsvpPageStyle({ base: "dark" })).toBeUndefined();
  });

  it("keeps valid values and drops junk", () => {
    expect(
      sanitizeRsvpPageStyle({
        base: "theme",
        layout: "poster",
        colors: {
          pageBg: "#abcdef",
          title: "red",
          accent: "#abc",
          nope: "#000000",
        },
        fonts: { title: "  ", body: "'Jost', sans-serif", extra: 1 },
        shape: { radius: "round", border: "yes", shadow: "strong" },
        header: {
          showDate: false,
          showEyebrow: "no",
          imageUrl: "https://cdn.example.com/x.jpg",
        },
        extra: true,
      }),
    ).toEqual({
      base: "theme",
      colors: { pageBg: "#abcdef" },
      fonts: { body: "'Jost', sans-serif" },
      shape: { radius: "round", shadow: "strong" },
      header: { showDate: false, imageUrl: "https://cdn.example.com/x.jpg" },
    });
  });

  it("omits empty groups", () => {
    expect(
      sanitizeRsvpPageStyle({
        base: "neutral",
        colors: {},
        fonts: {},
        shape: {},
        header: {},
      }),
    ).toEqual({ base: "neutral" });
  });
});
