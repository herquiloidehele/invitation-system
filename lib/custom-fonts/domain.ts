import type {
  AdminCustomFontFamily,
  CustomFontFormat,
  CustomFontManifest,
  FontCatalogEntry,
  FontCategory,
} from "./types";

export type CustomFontArchiveFilter = "active" | "archived" | "all";

export const CUSTOM_FONT_PREFIX = "custom-font-";

const GENERIC_FALLBACK: Record<FontCategory, string> = {
  serif: "serif",
  "sans-serif": "sans-serif",
  display: "serif",
  handwriting: "cursive",
  monospace: "monospace",
};

const CSS_FORMAT: Record<CustomFontFormat, string> = {
  woff2: "woff2",
  woff: "woff",
  ttf: "truetype",
  otf: "opentype",
};

const MIME_TYPE: Record<CustomFontFormat, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  otf: "font/otf",
};

function firstFour(bytes: Uint8Array): string {
  if (bytes.length < 4) return "";
  return Array.from(bytes.slice(0, 4))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function unquoteFamily(stack: string): string {
  return stack
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

export function buildCustomFontCssFamily(id: string): string {
  return `${CUSTOM_FONT_PREFIX}${id}`;
}

export function buildCustomFontStack(
  id: string,
  category: FontCategory,
): string {
  return `'${buildCustomFontCssFamily(id)}', ${GENERIC_FALLBACK[category]}`;
}

export function extractCustomFontFamilyId(stack: string): string | null {
  const family = unquoteFamily(stack);
  if (!family.startsWith(CUSTOM_FONT_PREFIX)) return null;
  const id = family.slice(CUSTOM_FONT_PREFIX.length);
  return id || null;
}

export function normalizeCustomFontName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function detectFontFormat(bytes: Uint8Array): CustomFontFormat {
  const signature = firstFour(bytes);
  if (signature === "74746366") {
    throw new Error("Font collections are not supported");
  }
  if (signature === "774f4632") return "woff2";
  if (signature === "774f4646") return "woff";
  if (signature === "00010000" || signature === "74727565") return "ttf";
  if (signature === "4f54544f") return "otf";
  throw new Error("Unsupported font format");
}

export function fontMimeType(format: CustomFontFormat): string {
  return MIME_TYPE[format];
}

function catalogRank(entry: FontCatalogEntry): number {
  if (entry.source === "custom") return entry.archived ? 3 : 0;
  return entry.source === "builtin" ? 1 : 2;
}

export function sortFontCatalog(
  fonts: readonly FontCatalogEntry[],
): FontCatalogEntry[] {
  return [...fonts].sort((left, right) => {
    const rank = catalogRank(left) - catalogRank(right);
    return rank || left.family.localeCompare(right.family);
  });
}

function catalogKey(entry: FontCatalogEntry): string {
  return entry.source === "custom"
    ? `custom:${entry.id}`
    : `catalog:${entry.family.toLocaleLowerCase()}`;
}

export function mergeFontCatalog(input: {
  custom: readonly FontCatalogEntry[];
  google: readonly FontCatalogEntry[];
  selected?: FontCatalogEntry | null;
}): FontCatalogEntry[] {
  const selectedArchived =
    input.selected?.source === "custom" && input.selected.archived
      ? input.selected
      : null;
  const selectedKey = selectedArchived ? catalogKey(selectedArchived) : null;
  const seen = new Set<string>();
  const merged = [...input.custom, ...input.google].filter((entry) => {
    const key = catalogKey(entry);
    if (key === selectedKey || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return selectedArchived
    ? [selectedArchived, ...sortFontCatalog(merged)]
    : sortFontCatalog(merged);
}

export function findSelectedFontCatalogEntry(
  fonts: readonly FontCatalogEntry[],
  value: string,
): FontCatalogEntry | null {
  const customId = extractCustomFontFamilyId(value);
  return (
    fonts.find((font) =>
      customId && font.source === "custom"
        ? font.id === customId
        : font.value === value,
    ) ?? null
  );
}

export function filterFontCatalog(
  fonts: readonly FontCatalogEntry[],
  filters: {
    source: "all" | "custom" | "google";
    category: FontCategory | "all";
    search: string;
  },
): FontCatalogEntry[] {
  const search = normalizeCustomFontName(filters.search);
  return fonts.filter((font) => {
    if (filters.source === "custom" && font.source !== "custom") return false;
    if (filters.source === "google" && font.source === "custom") return false;
    if (filters.category !== "all" && font.category !== filters.category) {
      return false;
    }
    return !search || normalizeCustomFontName(font.family).includes(search);
  });
}

export function summarizeCustomFontLibrary(
  families: readonly AdminCustomFontFamily[],
) {
  return families.reduce(
    (summary, family) => {
      summary.families += 1;
      summary.variants += family.variants.length;
      summary[family.archived ? "archived" : "active"] += 1;
      return summary;
    },
    { families: 0, active: 0, archived: 0, variants: 0 },
  );
}

export function filterCustomFontFamilies(
  families: readonly AdminCustomFontFamily[],
  filters: { search: string; archived: CustomFontArchiveFilter },
): AdminCustomFontFamily[] {
  const search = normalizeCustomFontName(filters.search);
  return families.filter((family) => {
    if (filters.archived === "active" && family.archived) return false;
    if (filters.archived === "archived" && !family.archived) return false;
    return !search || normalizeCustomFontName(family.family).includes(search);
  });
}

export function buildCustomFontFaceCss(
  manifest: CustomFontManifest,
): string {
  const family = manifest.cssFamily.replaceAll("'", "\\'");
  return [...manifest.variants]
    .sort(
      (left, right) =>
        left.weight - right.weight || left.style.localeCompare(right.style),
    )
    .map(
      (variant) => `@font-face {
  font-family: '${family}';
  src: url('${variant.url}') format('${CSS_FORMAT[variant.format]}');
  font-weight: ${variant.weight};
  font-style: ${variant.style};
  font-display: swap;
}`,
    )
    .join("\n");
}
