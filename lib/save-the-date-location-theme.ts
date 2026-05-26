import type { SaveTheDateThemeData } from "./save-the-date";
import type { TemplateTheme } from "./types";

function hexToRgba(hex: string, alpha: number): string {
  const match = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return hex;

  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export function getSaveTheDateLocationTheme(
  theme: SaveTheDateThemeData,
): TemplateTheme {
  return {
    id: theme.id,
    name: theme.name,
    label: theme.label,
    description: theme.description,
    envelope: theme.envelope ?? {
      base: theme.bgColor,
      topFlap: theme.bgColor,
      bottomFlap: theme.bgColor,
    },
    bg: theme.bgColor,
    cardBg: "rgba(255,255,255,0.78)",
    cardBorder: hexToRgba(theme.heartColor, 0.28),
    primary: theme.heartColor,
    secondary: theme.rsvpButtonBgColor,
    accent: theme.heartColor,
    textPrimary: theme.textColor,
    textSecondary: theme.textColor,
    textMuted: hexToRgba(theme.textColor, 0.6),
    displayFont: theme.titleFont,
    bodyFont: theme.dateFont,
    scriptFont: theme.coupleFont,
    uiFont: theme.dateFont,
    sectionTitleFont: theme.titleFont,
    ctaPrimaryBg: theme.rsvpButtonBgColor,
    ctaPrimaryText: "#FFFFFF",
    ctaSecondaryBorder: theme.heartColor,
    ctaSecondaryText: theme.textColor,
    ctaRadius: "9999px",
    monogramColor: theme.heartColor,
    tapTextColor: theme.textColor,
    decorativeColor: theme.heartColor,
  };
}
