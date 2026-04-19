import { prisma } from "./db";
import type { EnvelopeConfig } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaveTheDateCouple {
  bride: string;
  groom: string;
}

export interface SaveTheDateDate {
  iso: string;
  display: string;
  day: string;
  month: string;
  year: string;
}

/** Envelope config on theme level — all fields required (the theme defaults). */
export interface STDEnvelopeTheme {
  base: string;
  topFlap: string;
  bottomFlap: string;
}

export interface SaveTheDateThemeData {
  id: string;
  name: string;
  label: string;
  description: string;
  heartColor: string;
  heartGlitterColors: string[];
  heartTextureUrl?: string; // optional real glitter texture image URL
  bgColor: string;
  titleFont: string;
  coupleFont: string;
  dateFont: string;
  textColor: string;
  confettiColors: string[];
  /** Envelope cover configuration. Null means no envelope for this theme. */
  envelope: STDEnvelopeTheme | null;
}

export interface SaveTheDateData {
  id: string;
  slug: string;
  couple: SaveTheDateCouple;
  date: SaveTheDateDate;
  customMessage: string | null;
  theme: SaveTheDateThemeData;
  /** Per-STD envelope overrides (base, topFlap, bottomFlap, shimmer). */
  envelope: EnvelopeConfig | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSaveTheDateTheme(row: {
  id: string;
  name: string;
  label: string;
  description: string;
  heartColor: string;
  heartGlitterColors: unknown;
  heartTextureUrl: string | null;
  bgColor: string;
  titleFont: string;
  coupleFont: string;
  dateFont: string;
  textColor: string;
  confettiColors: unknown;
  envelope: unknown;
}): SaveTheDateThemeData {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    description: row.description,
    heartColor: row.heartColor,
    heartGlitterColors: row.heartGlitterColors as string[],
    heartTextureUrl: row.heartTextureUrl ?? undefined,
    bgColor: row.bgColor,
    titleFont: row.titleFont,
    coupleFont: row.coupleFont,
    dateFont: row.dateFont,
    textColor: row.textColor,
    confettiColors: row.confettiColors as string[],
    envelope: row.envelope
      ? (row.envelope as unknown as STDEnvelopeTheme)
      : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getSaveTheDate(
  slug: string
): Promise<SaveTheDateData | null> {
  const row = await prisma.saveTheDate.findUnique({
    where: { slug },
    include: { theme: true },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    couple: row.couple as unknown as SaveTheDateCouple,
    date: row.date as unknown as SaveTheDateDate,
    customMessage: row.customMessage,
    theme: toSaveTheDateTheme(row.theme),
    envelope: row.envelope
      ? (row.envelope as unknown as EnvelopeConfig)
      : null,
  };
}

export async function getSaveDateThemes(): Promise<SaveTheDateThemeData[]> {
  const rows = await prisma.saveTheDateTheme.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toSaveTheDateTheme);
}

export async function getSaveDateTheme(
  name: string
): Promise<SaveTheDateThemeData | null> {
  const row = await prisma.saveTheDateTheme.findUnique({
    where: { name },
  });
  return row ? toSaveTheDateTheme(row) : null;
}
