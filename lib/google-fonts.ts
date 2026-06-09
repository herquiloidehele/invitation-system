// ---------------------------------------------------------------------------
// Google Fonts API client — fetches the full font catalog, caches it in-memory,
// and provides helpers for searching / filtering.
// ---------------------------------------------------------------------------

/** Category values returned by the Google Fonts API. */
export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "handwriting"
  | "monospace";

/** Simplified font entry used throughout the app. */
export interface GoogleFontEntry {
  family: string;
  category: FontCategory;
  variants: string[]; // e.g. ["100","200","regular","700","italic","700italic"]
  /** Whether this font is one of the statically-loaded builtins (via next/font/google). */
  builtin: boolean;
}

/** Raw shape of items returned by the Google Fonts Developer API. */
interface GoogleFontsAPIItem {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
}

interface GoogleFontsAPIResponse {
  kind: string;
  items: GoogleFontsAPIItem[];
}

// ---------------------------------------------------------------------------
// Builtin fonts — the 2 fonts loaded via next/font/google in app/layout.tsx.
// These are self-hosted and performance-optimized; we mark them as "builtin"
// so the font picker can prioritise them AND so `useDynamicFonts` skips
// re-injecting a Google Fonts <link> for them.
//
// All other decorative families are loaded on demand at runtime, so they
// are NOT listed here.
// ---------------------------------------------------------------------------

export const BUILTIN_FONT_FAMILIES: string[] = [
  "Cormorant Garamond",
  "Outfit",
];

const BUILTIN_SET = new Set(BUILTIN_FONT_FAMILIES.map((f) => f.toLowerCase()));

/** Check whether a font family name matches one of the builtins (case-insensitive). */
export function isBuiltinFont(family: string): boolean {
  return BUILTIN_SET.has(family.toLowerCase());
}

// ---------------------------------------------------------------------------
// Generic CSS fallback for a category.
// ---------------------------------------------------------------------------

const CATEGORY_FALLBACK: Record<FontCategory, string> = {
  serif: "serif",
  "sans-serif": "sans-serif",
  display: "serif",
  handwriting: "cursive",
  monospace: "monospace",
};

/** Build a CSS font-family value: `'Playfair Display', serif` */
export function buildFontStack(family: string, category: FontCategory): string {
  return `'${family}', ${CATEGORY_FALLBACK[category]}`;
}

/** Extract the bare family name from a CSS font-family string like `'Playfair Display', serif` */
export function extractFamilyName(stack: string): string {
  const m = stack.match(/^'([^']+)'/);
  return m ? m[1] : stack.split(",")[0].trim().replace(/['"]/g, "");
}

// ---------------------------------------------------------------------------
// In-memory cache with a 24-hour TTL.
// ---------------------------------------------------------------------------

let cachedFonts: GoogleFontEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isCacheValid(): boolean {
  return cachedFonts !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// Fetch the full font list from the Google Fonts Developer API.
// ---------------------------------------------------------------------------

const API_BASE = "https://www.googleapis.com/webfonts/v1/webfonts";

async function fetchGoogleFonts(): Promise<GoogleFontEntry[]> {
  if (isCacheValid()) return cachedFonts!;

  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  const url = apiKey
    ? `${API_BASE}?key=${apiKey}&sort=popularity`
    : `${API_BASE}?sort=popularity`;

  const res = await fetch(url, { next: { revalidate: 86400 } }); // ISR-style 24h
  if (!res.ok) {
    throw new Error(
      `Google Fonts API returned ${res.status}: ${res.statusText}`,
    );
  }

  const data: GoogleFontsAPIResponse = await res.json();

  cachedFonts = data.items.map((item) => ({
    family: item.family,
    category: item.category as FontCategory,
    variants: item.variants,
    builtin: isBuiltinFont(item.family),
  }));
  cacheTimestamp = Date.now();

  return cachedFonts;
}

// ---------------------------------------------------------------------------
// Search / filter helpers
// ---------------------------------------------------------------------------

export interface FontSearchParams {
  search?: string;
  category?: FontCategory;
  page?: number;
  limit?: number;
}

export interface FontSearchResult {
  fonts: GoogleFontEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export async function searchGoogleFonts(
  params: FontSearchParams,
): Promise<FontSearchResult> {
  const allFonts = await fetchGoogleFonts();
  const { search, category, page = 1, limit = 50 } = params;

  let filtered = allFonts;

  if (category) {
    filtered = filtered.filter((f) => f.category === category);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((f) => f.family.toLowerCase().includes(q));
  }

  // Sort: builtins first, then by original order (popularity)
  filtered.sort((a, b) => {
    if (a.builtin && !b.builtin) return -1;
    if (!a.builtin && b.builtin) return 1;
    return 0; // preserve original (popularity) order
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const fonts = filtered.slice(start, start + limit);

  return { fonts, total, page, totalPages };
}

// ---------------------------------------------------------------------------
// Build a Google Fonts CSS URL for dynamically loading a font.
// We request weights 300,400,500,600,700 for regular + italic.
// ---------------------------------------------------------------------------

export function buildGoogleFontUrl(
  family: string,
  weights: number[] = [300, 400, 500, 600, 700],
): string {
  const encoded = family.replace(/ /g, "+");
  const wghtAxis = weights.join(";");
  // Request both normal and italic via ital axis: ital,wght@0,300;0,400;...;1,400;1,700
  const tuples = [
    ...weights.map((w) => `0,${w}`),
    ...weights.map((w) => `1,${w}`),
  ].join(";");
  return `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@${tuples}&display=swap`;
}

/**
 * Build a Google Fonts CSS URL for a minimal preview (just weight 400).
 * Used in the font picker to keep network usage low.
 */
function buildGoogleFontPreviewUrl(families: string[]): string {
  const params = families
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
