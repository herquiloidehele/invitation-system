import { describe, expect, it } from "vitest";

import { resolveTextStyles } from "@/lib/text-styles";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";

const theme = {
  id: "t1",
  name: "test",
  label: "Test",
  description: "",
  envelope: { base: "#fff", topFlap: "#fff", bottomFlap: "#fff" },
  bg: "#fff",
  cardBg: "#fff",
  cardBorder: "#eee",
  primary: "#111",
  secondary: "#222",
  accent: "#C9A961",
  textPrimary: "#111",
  textSecondary: "#555",
  textMuted: "#999",
  displayFont: "Display",
  bodyFont: "Body",
  uiFont: "UI",
  ctaPrimaryBg: "#111",
  ctaPrimaryText: "#fff",
  ctaSecondaryBorder: "#111",
  ctaSecondaryText: "#111",
  ctaRadius: "8px",
  monogramColor: "#111",
  tapTextColor: "#111",
  decorativeColor: "#ccc",
} as TemplateTheme;

describe("resolveTextStyles — places elements", () => {
  it("provides default styles for every places element", () => {
    const ts = resolveTextStyles(theme);
    expect(ts.placesSectionTitle.fontFamily).toBeDefined();
    expect(ts.placeTitle.color).toBe(theme.textPrimary);
    expect(ts.placeDescription.color).toBe(theme.textSecondary);
    expect(ts.placeLink.color).toBe(theme.accent);
  });

  it("applies element-level overrides", () => {
    const overrides: TextStyleOverrides = {
      elements: {
        placeTitle: { color: "#ff0000", fontSize: 22 },
        placeLink: { color: "#00ff00" },
      },
    };
    const ts = resolveTextStyles(theme, overrides);
    expect(ts.placeTitle.color).toBe("#ff0000");
    expect(ts.placeTitle.fontSize).toBe(22);
    expect(ts.placeLink.color).toBe("#00ff00");
  });
});
