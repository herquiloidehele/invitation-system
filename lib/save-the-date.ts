import { prisma } from "./db";
import type {
  AudioConfig,
  EnvelopeConfig,
  LocationInfo,
  SocialPreview,
  TextStyleOverrides,
} from "./types";

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
  /** Event time in 24h "HH:MM" format. Optional. */
  time?: string;
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
  rsvpButtonBgColor: string;
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

export interface SaveTheDateRsvpConfig {
  enabled: boolean;
  deadline?: string;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
}

export interface BottomHeroConfig {
  enabled: boolean;
  mediaUrl: string;
  mediaType: "image" | "video";
  title: string;
  description: string;
}

export interface SaveTheDateData {
  id: string;
  slug: string;
  couple: SaveTheDateCouple;
  date: SaveTheDateDate;
  /** Optional first location card. */
  location?: LocationInfo;
  /** Optional second location card. */
  location2?: LocationInfo;
  customMessage: string | null;
  theme: SaveTheDateThemeData;
  /** Per-STD envelope overrides (base, coverBackground, topFlap, bottomFlap, shimmer). */
  envelope: EnvelopeConfig | null;
  /** Per-STD font/style overrides (same shape as invitation textStyles). */
  textStyles: TextStyleOverrides | null;
  /** RSVP configuration — null means feature not configured (treat as disabled). */
  rsvp: SaveTheDateRsvpConfig | null;
  /** Audio configuration — plays on envelope open when enabled. */
  audio: AudioConfig;
  /** Bottom hero section — full-viewport media section below the main content. */
  bottomHero: BottomHeroConfig | null;
  /** Override values used only for OG/Twitter meta tags. Image is never rendered on the page. */
  socialPreview: SocialPreview | null;
  /** Admin-only marker for public demo pages that can be indexed. */
  isDemo?: boolean;
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
  rsvpButtonBgColor: string;
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
    rsvpButtonBgColor: row.rsvpButtonBgColor,
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
  slug: string,
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
    location: row.location
      ? (row.location as unknown as LocationInfo)
      : undefined,
    location2: row.location2
      ? (row.location2 as unknown as LocationInfo)
      : undefined,
    customMessage: row.customMessage,
    theme: toSaveTheDateTheme(row.theme),
    envelope: row.envelope ? (row.envelope as unknown as EnvelopeConfig) : null,
    textStyles: row.textStyles
      ? (row.textStyles as unknown as TextStyleOverrides)
      : null,
    rsvp: row.rsvp ? (row.rsvp as unknown as SaveTheDateRsvpConfig) : null,
    audio: row.audio
      ? (row.audio as unknown as AudioConfig)
      : { enabled: false, src: "", artist: "", title: "" },
    bottomHero: row.bottomHero
      ? (row.bottomHero as unknown as BottomHeroConfig)
      : null,
    socialPreview: row.socialPreview
      ? (row.socialPreview as unknown as SocialPreview)
      : null,
    isDemo: row.isDemo,
  };
}

export async function getSaveDateThemes(): Promise<SaveTheDateThemeData[]> {
  const rows = await prisma.saveTheDateTheme.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toSaveTheDateTheme);
}

async function getSaveDateTheme(
  name: string,
): Promise<SaveTheDateThemeData | null> {
  const row = await prisma.saveTheDateTheme.findUnique({
    where: { name },
  });
  return row ? toSaveTheDateTheme(row) : null;
}
