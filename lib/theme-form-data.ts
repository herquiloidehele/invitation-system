import type { TemplateTheme } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeFormData {
  name: string;
  label: string;
  description: string;
  // Envelope (JSON fields stored as separate inputs)
  envelopeBase: string;
  envelopeTopFlap: string;
  envelopeBottomFlap: string;
  // Page colours
  bg: string;
  cardBg: string;
  cardBorder: string;
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Typography
  displayFont: string;
  bodyFont: string;
  scriptFont: string;
  uiFont: string;
  sectionTitleFont: string;
  sectionTitleFontSize: string;
  sectionTitleFontWeight: string;
  // CTA
  ctaPrimaryBg: string;
  ctaPrimaryText: string;
  ctaSecondaryBorder: string;
  ctaSecondaryText: string;
  ctaRadius: string;
  // Cover
  monogramColor: string;
  tapTextColor: string;
  // Atmospheric
  bgGradient: string;
  decorativeColor: string;
  ctaGlow: string;
  // Layout
  layout: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function themeToFormData(theme: TemplateTheme): ThemeFormData {
  return {
    name: theme.name,
    label: theme.label,
    description: theme.description,
    envelopeBase: theme.envelope.base,
    envelopeTopFlap: theme.envelope.topFlap,
    envelopeBottomFlap: theme.envelope.bottomFlap,
    bg: theme.bg,
    cardBg: theme.cardBg,
    cardBorder: theme.cardBorder,
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    displayFont: theme.displayFont,
    bodyFont: theme.bodyFont,
    scriptFont: theme.scriptFont ?? "",
    uiFont: theme.uiFont,
    sectionTitleFont: theme.sectionTitleFont ?? "",
    sectionTitleFontSize:
      theme.sectionTitleFontSize != null
        ? String(theme.sectionTitleFontSize)
        : "",
    sectionTitleFontWeight: theme.sectionTitleFontWeight ?? "",
    ctaPrimaryBg: theme.ctaPrimaryBg,
    ctaPrimaryText: theme.ctaPrimaryText,
    ctaSecondaryBorder: theme.ctaSecondaryBorder,
    ctaSecondaryText: theme.ctaSecondaryText,
    ctaRadius: theme.ctaRadius,
    monogramColor: theme.monogramColor,
    tapTextColor: theme.tapTextColor,
    bgGradient: theme.bgGradient ?? "",
    decorativeColor: theme.decorativeColor,
    ctaGlow: theme.ctaGlow ?? "",
    layout: theme.layout ?? "default",
  };
}

/**
 * Convert form state back to a TemplateTheme for live preview.
 * Uses a placeholder id/name so the preview works before the theme is saved.
 */
export function formDataToTheme(form: ThemeFormData): TemplateTheme {
  return {
    id: "__preview__",
    name: form.name || "__preview__",
    label: form.label || "Pré-visualização",
    description: form.description,
    envelope: {
      base: form.envelopeBase,
      topFlap: form.envelopeTopFlap,
      bottomFlap: form.envelopeBottomFlap,
    },
    bg: form.bg,
    cardBg: form.cardBg,
    cardBorder: form.cardBorder,
    primary: form.primary,
    secondary: form.secondary,
    accent: form.accent,
    textPrimary: form.textPrimary,
    textSecondary: form.textSecondary,
    textMuted: form.textMuted,
    displayFont: form.displayFont,
    bodyFont: form.bodyFont,
    scriptFont: form.scriptFont || undefined,
    uiFont: form.uiFont,
    sectionTitleFont: form.sectionTitleFont || undefined,
    sectionTitleFontSize: form.sectionTitleFontSize
      ? Number(form.sectionTitleFontSize)
      : undefined,
    sectionTitleFontWeight: form.sectionTitleFontWeight || undefined,
    ctaPrimaryBg: form.ctaPrimaryBg,
    ctaPrimaryText: form.ctaPrimaryText,
    ctaSecondaryBorder: form.ctaSecondaryBorder,
    ctaSecondaryText: form.ctaSecondaryText,
    ctaRadius: form.ctaRadius,
    monogramColor: form.monogramColor,
    tapTextColor: form.tapTextColor,
    bgGradient: form.bgGradient || undefined,
    decorativeColor: form.decorativeColor,
    ctaGlow: form.ctaGlow || undefined,
    layout: (form.layout as TemplateTheme["layout"]) || "default",
  };
}

export const EMPTY_FORM_DATA: ThemeFormData = {
  name: "",
  label: "",
  description: "",
  envelopeBase: "#f8e8e0",
  envelopeTopFlap: "",
  envelopeBottomFlap: "",
  bg: "#ffffff",
  cardBg: "#ffffff",
  cardBorder: "#e5e7eb",
  primary: "#d4a0a0",
  secondary: "#8b6f6f",
  accent: "#d4a0a0",
  textPrimary: "#2d1b1b",
  textSecondary: "#6b3f3f",
  textMuted: "#9b7070",
  displayFont: "'Cormorant Garamond', serif",
  bodyFont: "'Cormorant Garamond', serif",
  scriptFont: "",
  uiFont: "'Outfit', sans-serif",
  sectionTitleFont: "",
  sectionTitleFontSize: "",
  sectionTitleFontWeight: "",
  ctaPrimaryBg: "#d4a0a0",
  ctaPrimaryText: "#ffffff",
  ctaSecondaryBorder: "#d4a0a0",
  ctaSecondaryText: "#d4a0a0",
  ctaRadius: "9999px",
  monogramColor: "#8b6f6f",
  tapTextColor: "#6b3f3f",
  bgGradient: "",
  decorativeColor: "#d4a0a0",
  ctaGlow: "",
  layout: "default",
};
