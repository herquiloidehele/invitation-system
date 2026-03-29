import type { CSSProperties } from "react";
import type { TemplateTheme, TextStyleOverrides, TextStyle } from "./types";

// ---------------------------------------------------------------------------
// Resolved styles — fully computed CSSProperties for every text element
// ---------------------------------------------------------------------------

export interface ResolvedTextStyles {
  /** Couple names (bride & groom) — normal page mode */
  coupleNames: CSSProperties;
  /** Couple names — video hero mode (larger, white) */
  coupleNamesVideo: CSSProperties;
  /** The "&" between names — normal page mode */
  ampersand: CSSProperties;
  /** The "&" — video hero mode */
  ampersandVideo: CSSProperties;
  /** Wedding quote text — normal page mode */
  quote: CSSProperties;
  /** Quote — video hero mode */
  quoteVideo: CSSProperties;
  /** Section titles (e.g. "Programação", "Nossa História") */
  sectionTitles: CSSProperties;
  /** Body/description text (story text, FAQ answers, etc.) */
  bodyText: CSSProperties;
  /** Small labels ("Dress Code", "Presentes", "Localização") */
  labels: CSSProperties;
  /** "Convidam para o casamento de" label — normal */
  inviteLabel: CSSProperties;
  /** "Convidam para o casamento de" label — video */
  inviteLabelVideo: CSSProperties;
  /** FAQ question text */
  faqQuestion: CSSProperties;
  /** FAQ answer text */
  faqAnswer: CSSProperties;
  /** Date — day number in save-the-date */
  dateDay: CSSProperties;
  /** Date — month text */
  dateMonth: CSSProperties;
  /** Date — year text */
  dateYear: CSSProperties;
  /** Date — time / day-of-week */
  dateTime: CSSProperties;
  /** Date pill in video hero */
  datePillVideo: CSSProperties;
  /** Blessing message (parents mode) */
  blessingMessage: CSSProperties;
  /** Blessing message — video */
  blessingMessageVideo: CSSProperties;
  /** Parents names */
  parentsNames: CSSProperties;
  /** Parents names — video */
  parentsNamesVideo: CSSProperties;
  /** Invite message (parents mode) */
  inviteMessage: CSSProperties;
  /** Invite message — video */
  inviteMessageVideo: CSSProperties;
  /** Footer monogram */
  footerMonogram: CSSProperties;
  /** Footer date */
  footerDate: CSSProperties;
  /** CTA section label ("Confirme sua presença") */
  ctaLabel: CSSProperties;
  /** Gift link text */
  giftLink: CSSProperties;
  /** Location venue name */
  locationName: CSSProperties;
  /** Location address */
  locationAddress: CSSProperties;
  /** Guest guide item label */
  guideItemLabel: CSSProperties;
  /** Guest guide script title ("Bom Convidado") */
  guideScriptTitle: CSSProperties;
  /** "Save the Date" label text */
  saveLabel: CSSProperties;
  /** "+ Adicionar ao Calendário" button text */
  calendarCta: CSSProperties;
  /** Countdown number value (days, hours, minutes, seconds) */
  countdownValue: CSSProperties;
  /** Countdown unit label ("Dias", "Horas", etc.) */
  countdownLabel: CSSProperties;
  /** Countdown date context ("day · month · year") */
  countdownDate: CSSProperties;
  /** Countdown weekday & time ("Segunda-feira · 16:00") */
  countdownWeekday: CSSProperties;
  /** Decorative accent line between sections (color controls the gradient) */
  accentLine: CSSProperties;

  // -- Resolved role-level values for sub-components that need individual props --
  /** Resolved display font (for sub-components) */
  displayFont: string;
  /** Resolved body font */
  bodyFont: string;
  /** Resolved script font */
  scriptFont: string;
  /** Resolved UI font */
  uiFont: string;
  /** Resolved text colors */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isScriptFont(displayFont: string): boolean {
  const lower = displayFont.toLowerCase();
  return (
    lower.includes("great vibes") ||
    lower.includes("homemade apple") ||
    lower.includes("pinyon script") ||
    lower.includes("cursive")
  );
}

/** Merge a base style with an optional element-level TextStyle override. */
function applyOverride(
  base: CSSProperties,
  override?: TextStyle,
): CSSProperties {
  if (!override) return base;
  const result = { ...base };
  if (override.fontFamily !== undefined)
    result.fontFamily = override.fontFamily;
  if (override.fontSize !== undefined) result.fontSize = override.fontSize;
  if (override.color !== undefined) result.color = override.color;
  if (override.fontWeight !== undefined)
    result.fontWeight = override.fontWeight;
  if (override.letterSpacing !== undefined)
    result.letterSpacing = override.letterSpacing;
  return result;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the full set of text styles for an invitation, merging:
 *   1. Hardcoded defaults (lowest priority)
 *   2. Theme values
 *   3. Invitation role-level overrides (textStyles.fonts, textStyles.colors)
 *   4. Invitation element-level overrides (textStyles.elements) — highest priority
 */
export function resolveTextStyles(
  theme: TemplateTheme,
  overrides?: TextStyleOverrides | null,
): ResolvedTextStyles {
  // -- Tier 1: Resolve role-level values --
  const displayFont = overrides?.fonts?.display ?? theme.displayFont;
  const bodyFont = overrides?.fonts?.body ?? theme.bodyFont;
  const scriptFont =
    overrides?.fonts?.script ??
    theme.scriptFont ??
    "'Cormorant Garamond', serif";
  const uiFont = overrides?.fonts?.ui ?? theme.uiFont;

  const textPrimary = overrides?.colors?.textPrimary ?? theme.textPrimary;
  const textSecondary = overrides?.colors?.textSecondary ?? theme.textSecondary;
  const textMuted = overrides?.colors?.textMuted ?? theme.textMuted;
  const accent = overrides?.colors?.accent ?? theme.accent;

  const nameFontSize = isScriptFont(displayFont) ? 52 : 46;
  const el = overrides?.elements;

  // -- Tier 2: Build base styles per element, then apply element-level overrides --

  const coupleNames = applyOverride(
    {
      fontFamily: displayFont,
      fontSize: nameFontSize,
      lineHeight: 1.1,
      color: textPrimary,
    },
    el?.coupleNames,
  );

  const coupleNamesVideo = applyOverride(
    {
      fontFamily: displayFont,
      fontSize: nameFontSize + 10,
      lineHeight: 1.05,
      color: "#ffffff",
      textShadow: "0 2px 40px rgba(0,0,0,0.5)",
    },
    el?.coupleNames,
  );

  const ampersand = applyOverride(
    {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 26,
      fontStyle: "italic" as const,
      color: accent,
    },
    el?.ampersand,
  );

  const ampersandVideo = applyOverride(
    {
      fontFamily: scriptFont,
      fontSize: 34,
      fontStyle: "italic" as const,
      color: "rgba(255,255,255,0.75)",
      textShadow: "0 2px 20px rgba(0,0,0,0.35)",
    },
    el?.ampersand,
  );

  const quote = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 16,
      fontStyle: "italic" as const,
      lineHeight: 1.65,
      color: textSecondary,
    },
    el?.quote,
  );

  const quoteVideo = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 14,
      fontStyle: "italic" as const,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.5)",
    },
    el?.quote,
  );

  const sectionTitles = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 400,
      letterSpacing: 4,
      textTransform: "uppercase" as const,
      color: textSecondary,
    },
    el?.sectionTitles,
  );

  const bodyText = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 14,
      lineHeight: 1.8,
      color: textSecondary,
    },
    el?.bodyText,
  );

  const labels = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: 3,
      textTransform: "uppercase" as const,
      color: textMuted,
    },
    el?.labels,
  );

  const inviteLabel = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 300,
      letterSpacing: 4,
      textTransform: "uppercase" as const,
      color: textSecondary,
    },
    el?.inviteLabel ?? el?.sectionTitles,
  );

  const inviteLabelVideo = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 300,
      letterSpacing: 5,
      textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.65)",
    },
    el?.inviteLabel ?? el?.sectionTitles,
  );

  const faqQuestion = applyOverride(
    { fontFamily: bodyFont, fontSize: 14, fontWeight: 500, lineHeight: 1.5 },
    el?.faqQuestion ?? el?.bodyText,
  );

  const faqAnswer = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 12,
      lineHeight: 1.75,
      color: textSecondary,
      opacity: 0.8,
    },
    el?.faqAnswer ?? el?.bodyText,
  );

  const dateDay = applyOverride(
    {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 96,
      fontWeight: 300,
      lineHeight: 1,
      color: textPrimary,
      letterSpacing: -2,
    },
    el?.dateDay,
  );

  const dateMonth = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 8,
      textTransform: "uppercase" as const,
      color: textSecondary,
    },
    el?.dateMonth,
  );

  const dateYear = applyOverride(
    { fontFamily: bodyFont, fontSize: 20, fontWeight: 300, color: textMuted },
    el?.dateYear,
  );

  const dateTime = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 13,
      fontWeight: 300,
      letterSpacing: 1,
      color: textSecondary,
    },
    el?.dateTime,
  );

  const datePillVideo = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 300,
      letterSpacing: 6,
      textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.6)",
    },
    el?.dateTime,
  );

  const blessingMessage = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 13,
      fontStyle: "italic" as const,
      color: textSecondary,
      letterSpacing: 0.5,
    },
    el?.blessingMessage,
  );

  const blessingMessageVideo = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 13,
      fontStyle: "italic" as const,
      color: "rgba(255,255,255,0.65)",
      letterSpacing: 1,
    },
    el?.blessingMessage,
  );

  const parentsNames = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 13,
      color: textPrimary,
      lineHeight: 1.6,
    },
    el?.parentsNames,
  );

  const parentsNamesVideo = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      lineHeight: 1.6,
    },
    el?.parentsNames,
  );

  const inviteMessage = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 14,
      fontStyle: "italic" as const,
      lineHeight: 1.65,
      color: textSecondary,
    },
    el?.inviteMessage,
  );

  const inviteMessageVideo = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 13,
      fontStyle: "italic" as const,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.55)",
    },
    el?.inviteMessage,
  );

  const footerMonogram = applyOverride(
    {
      fontFamily: displayFont,
      fontSize: 22,
      color: textMuted,
      letterSpacing: 2,
    },
    el?.footerMonogram,
  );

  const footerDate = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 300,
      letterSpacing: 3,
      color: textMuted,
    },
    el?.footerDate,
  );

  const ctaLabel = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 400,
      letterSpacing: 4,
      textTransform: "uppercase" as const,
      color: textSecondary,
    },
    el?.ctaLabel ?? el?.sectionTitles,
  );

  const giftLink = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
      color: accent,
      textDecoration: "none",
    },
    el?.giftLink,
  );

  const locationName = applyOverride(
    { fontFamily: bodyFont, fontSize: 16, fontWeight: 600, color: textPrimary },
    el?.locationName ?? el?.bodyText,
  );

  const locationAddress = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 14,
      fontWeight: 400,
      color: textSecondary,
      lineHeight: 1.5,
    },
    el?.locationAddress,
  );

  const guideItemLabel = applyOverride(
    {
      fontFamily: bodyFont,
      fontSize: 12,
      fontWeight: 500,
      color: textPrimary,
      lineHeight: 1.4,
    },
    el?.guideItemLabel ?? el?.labels,
  );

  const guideScriptTitle = applyOverride(
    {
      fontFamily: scriptFont ?? displayFont,
      fontSize: 28,
      color: theme.primary,
      lineHeight: 1.2,
      marginTop: 2,
    },
    el?.guideScriptTitle,
  );

  const saveLabel = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 400,
      letterSpacing: 5,
      textTransform: "uppercase" as const,
      color: accent,
    },
    el?.saveLabel,
  );

  const calendarCta = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
      color: accent,
      opacity: 0.75,
    },
    el?.calendarCta,
  );

  const countdownValue = applyOverride(
    {
      fontSize: 25,
      fontWeight: 300,
      lineHeight: 1,
      color: textPrimary,
      letterSpacing: -1,
    },
    el?.countdownValue,
  );

  const countdownLabel = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: 2.5,
      textTransform: "uppercase" as const,
      color: textMuted,
    },
    el?.countdownLabel,
  );

  const countdownDate = applyOverride(
    {
      fontFamily: scriptFont,
      fontSize: 22,
      fontWeight: 300,
      color: textPrimary,
      letterSpacing: 1,
    },
    el?.countdownDate,
  );

  const countdownWeekday = applyOverride(
    {
      fontFamily: uiFont,
      fontSize: 12,
      fontWeight: 300,
      letterSpacing: 1,
      color: textMuted,
    },
    el?.countdownWeekday,
  );

  const accentLine = applyOverride(
    {
      color: accent,
      opacity: 0.35,
    },
    el?.accentLine,
  );

  return {
    coupleNames,
    coupleNamesVideo,
    ampersand,
    ampersandVideo,
    quote,
    quoteVideo,
    sectionTitles,
    bodyText,
    labels,
    inviteLabel,
    inviteLabelVideo,
    faqQuestion,
    faqAnswer,
    dateDay,
    dateMonth,
    dateYear,
    dateTime,
    datePillVideo,
    blessingMessage,
    blessingMessageVideo,
    parentsNames,
    parentsNamesVideo,
    inviteMessage,
    inviteMessageVideo,
    footerMonogram,
    footerDate,
    ctaLabel,
    giftLink,
    locationName,
    locationAddress,
    guideItemLabel,
    guideScriptTitle,
    saveLabel,
    calendarCta,
    countdownValue,
    countdownLabel,
    countdownDate,
    countdownWeekday,
    accentLine,
    // Role-level resolved values
    displayFont,
    bodyFont,
    scriptFont,
    uiFont,
    textPrimary,
    textSecondary,
    textMuted,
    accent,
  };
}
