import { prisma } from "./db";
import type { TemplateTheme } from "./types";
import type { Theme } from "./generated/prisma/client";

// ---------------------------------------------------------------------------
// Helpers — convert Prisma Theme row → TemplateTheme
// ---------------------------------------------------------------------------

function toTemplateTheme(row: Theme): TemplateTheme {
  const envelope = row.envelope as {
    base: string;
    topFlap: string;
    bottomFlap: string;
  };

  return {
    id: row.id,
    name: row.name,
    label: row.label,
    description: row.description,
    envelope: {
      base: envelope.base,
      topFlap: envelope.topFlap,
      bottomFlap: envelope.bottomFlap,
    },
    bg: row.bg,
    cardBg: row.cardBg,
    cardBorder: row.cardBorder,
    primary: row.primary,
    secondary: row.secondary,
    accent: row.accent,
    textPrimary: row.textPrimary,
    textSecondary: row.textSecondary,
    textMuted: row.textMuted,
    displayFont: row.displayFont,
    bodyFont: row.bodyFont,
    scriptFont: row.scriptFont ?? undefined,
    uiFont: row.uiFont,
    sectionTitleFont: row.sectionTitleFont ?? undefined,
    sectionTitleFontSize: row.sectionTitleFontSize ?? undefined,
    sectionTitleFontWeight: row.sectionTitleFontWeight ?? undefined,
    ctaPrimaryBg: row.ctaPrimaryBg,
    ctaPrimaryText: row.ctaPrimaryText,
    ctaSecondaryBorder: row.ctaSecondaryBorder,
    ctaSecondaryText: row.ctaSecondaryText,
    ctaRadius: row.ctaRadius,
    monogramColor: row.monogramColor,
    tapTextColor: row.tapTextColor,
    bgGradient: row.bgGradient ?? undefined,
    decorativeColor: row.decorativeColor,
    ctaGlow: row.ctaGlow ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all themes from the database, ordered by creation date. */
export async function getThemes(): Promise<TemplateTheme[]> {
  const rows = await prisma.theme.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toTemplateTheme);
}

/** Fetch a single theme by its slug name (e.g. "pink-floral"). Returns null if not found. */
export async function getTheme(name: string): Promise<TemplateTheme | null> {
  const row = await prisma.theme.findUnique({ where: { name } });
  return row ? toTemplateTheme(row) : null;
}

/** Fetch a single theme by its database id. Returns null if not found. */
export async function getThemeById(id: string): Promise<TemplateTheme | null> {
  const row = await prisma.theme.findUnique({ where: { id } });
  return row ? toTemplateTheme(row) : null;
}
