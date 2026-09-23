import { describe, expect, it } from "vitest";

import { isTextElementHidden, resolveTextStyles } from "@/lib/text-styles";
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

describe("resolveTextStyles — gift accordion elements", () => {
  it("defaults reproduce the previous inline gift accordion styles", () => {
    const ts = resolveTextStyles(theme);
    expect(ts.giftAccordionHeader).toMatchObject({
      fontFamily: "UI",
      fontSize: "0.82rem",
      fontWeight: 500,
      color: "#111",
    });
    expect(ts.giftBankText).toMatchObject({
      fontFamily: "Body",
      fontSize: "0.82rem",
      color: "#555",
    });
    expect(ts.giftBankLabel).toMatchObject({
      fontFamily: "UI",
      fontSize: "0.78rem",
      fontWeight: 600,
      color: "#111",
    });
    expect(ts.giftBankValue).toMatchObject({
      fontFamily: "UI",
      fontSize: "0.78rem",
      color: "#555",
    });
    expect(ts.giftCopyButton).toMatchObject({
      fontFamily: "UI",
      fontSize: "0.72rem",
    });
    // The copy button's colour follows the card accent unless overridden.
    expect(ts.giftCopyButton.color).toBeUndefined();
  });

  it("applies element-level overrides", () => {
    const overrides: TextStyleOverrides = {
      elements: {
        giftAccordionHeader: { fontSize: 16, textTransform: "uppercase" },
        giftBankText: { fontStyle: "italic" },
        giftBankLabel: { color: "#ff0000", textAlign: "left" },
        giftBankValue: { letterSpacing: 1 },
        giftCopyButton: { color: "#00ff00", fontWeight: "700" },
      },
    };
    const ts = resolveTextStyles(theme, overrides);
    expect(ts.giftAccordionHeader.fontSize).toBe(16);
    expect(ts.giftAccordionHeader.textTransform).toBe("uppercase");
    expect(ts.giftBankText.fontStyle).toBe("italic");
    expect(ts.giftBankLabel.color).toBe("#ff0000");
    expect(ts.giftBankLabel.textAlign).toBe("left");
    expect(ts.giftBankValue.letterSpacing).toBe(1);
    expect(ts.giftCopyButton.color).toBe("#00ff00");
    expect(ts.giftCopyButton.fontWeight).toBe("700");
  });

  it("hides each gift element independently", () => {
    const overrides: TextStyleOverrides = {
      elements: { giftBankLabel: { hidden: true } },
    };
    expect(isTextElementHidden(overrides, "giftBankLabel")).toBe(true);
    expect(isTextElementHidden(overrides, "giftBankValue")).toBe(false);
  });
});
