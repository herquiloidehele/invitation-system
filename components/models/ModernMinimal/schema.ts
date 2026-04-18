import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for ModernMinimal styles
// Validates the InvitationStyles shape used by this model.
// ---------------------------------------------------------------------------

const envelopeSchema = z.object({
  base: z.string(),
  topFlap: z.string(),
  bottomFlap: z.string(),
});

const textStyleSchema = z
  .object({
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    color: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    letterSpacing: z.number().optional(),
  })
  .optional();

const textStyleOverridesSchema = z
  .object({
    fonts: z
      .object({
        display: z.string().optional(),
        body: z.string().optional(),
        script: z.string().optional(),
        ui: z.string().optional(),
        sectionTitle: z.string().optional(),
      })
      .optional(),
    sectionTitleFontSize: z.number().optional(),
    sectionTitleFontWeight: z.union([z.string(), z.number()]).optional(),
    colors: z
      .object({
        textPrimary: z.string().optional(),
        textSecondary: z.string().optional(),
        textMuted: z.string().optional(),
        accent: z.string().optional(),
      })
      .optional(),
    elements: z.record(z.string(), textStyleSchema).optional(),
  })
  .optional();

const cardStyleSchema = z
  .object({
    cardBg: z.string().optional(),
    cardBorder: z.string().optional(),
    borderRadius: z.number().optional(),
  })
  .optional();

const cardStyleOverridesSchema = z
  .record(z.string(), cardStyleSchema)
  .optional();

export const modernMinimalStylesSchema = z.object({
  // Envelope
  envelope: envelopeSchema,
  // Page background & card
  bg: z.string(),
  cardBg: z.string(),
  cardBorder: z.string(),
  // Color palette
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  // Text colors
  textPrimary: z.string(),
  textSecondary: z.string(),
  textMuted: z.string(),
  // Typography
  displayFont: z.string(),
  bodyFont: z.string(),
  scriptFont: z.string().optional(),
  uiFont: z.string(),
  sectionTitleFont: z.string().optional(),
  sectionTitleFontSize: z.number().optional(),
  sectionTitleFontWeight: z.string().optional(),
  // CTA styling
  ctaPrimaryBg: z.string(),
  ctaPrimaryText: z.string(),
  ctaSecondaryBorder: z.string(),
  ctaSecondaryText: z.string(),
  ctaRadius: z.string(),
  // Cover
  monogramColor: z.string(),
  tapTextColor: z.string(),
  // Atmospheric / decorative
  bgGradient: z.string().optional(),
  decorativeColor: z.string(),
  ctaGlow: z.string().optional(),
  // Envelope shimmer
  envelopeShimmer: z.boolean().optional(),
  // Save the Date
  saveDateStyle: z
    .enum(["classic", "countdown", "quad-cards", "cinematic", "minimal-line"])
    .optional(),
  // Overrides
  textOverrides: textStyleOverridesSchema,
  cardOverrides: cardStyleOverridesSchema,
});
