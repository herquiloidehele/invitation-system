import { describe, expect, it } from "vitest";
import { getSaveTheDateLocationTheme } from "../lib/save-the-date-location-theme";

describe("getSaveTheDateLocationTheme", () => {
  it("maps save-the-date theme fields into LocationCard theme fields", () => {
    const theme = getSaveTheDateLocationTheme({
      id: "theme-1",
      name: "golden-heart",
      label: "Golden Heart",
      description: "Warm gold save the date",
      heartColor: "#D4AF37",
      heartGlitterColors: ["#F5E6A3"],
      rsvpButtonBgColor: "#A47722",
      bgColor: "#FFF8EA",
      titleFont: "Cormorant Garamond",
      coupleFont: "Great Vibes",
      dateFont: "Playfair Display",
      textColor: "#2F2418",
      confettiColors: ["#D4AF37"],
      envelope: null,
    });

    expect(theme).toMatchObject({
      id: "theme-1",
      name: "golden-heart",
      label: "Golden Heart",
      description: "Warm gold save the date",
      bg: "#FFF8EA",
      cardBg: "rgba(255,255,255,0.78)",
      cardBorder: "rgba(212,175,55,0.28)",
      primary: "#D4AF37",
      accent: "#D4AF37",
      textPrimary: "#2F2418",
      ctaPrimaryBg: "#A47722",
      ctaSecondaryBorder: "#D4AF37",
      ctaSecondaryText: "#2F2418",
      bodyFont: "Playfair Display",
      displayFont: "Cormorant Garamond",
      uiFont: "Playfair Display",
      ctaRadius: "9999px",
    });
  });
});
