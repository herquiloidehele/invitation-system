import type { AppLocale } from "@/i18n/locales";

export type LandingTranslationLocale = Exclude<AppLocale, "pt">;

export interface LandingTranslationOverlay {
  landingModelName?: string;
  landingSubtitle?: string;
  landingDescription?: string;
}

export type LandingTranslations = Partial<
  Record<LandingTranslationLocale, LandingTranslationOverlay>
>;

export interface LandingTextMetadata {
  landingModelName?: string | null;
  landingSubtitle?: string | null;
  landingDescription?: string | null;
  landingTranslations?: unknown;
}

type TranslatedLandingFields = Pick<
  LandingTextMetadata,
  "landingModelName" | "landingSubtitle" | "landingDescription"
>;

export type LocalizedLandingMetadata<T extends LandingTextMetadata> = Omit<
  T,
  keyof TranslatedLandingFields
> &
  TranslatedLandingFields;

export type LandingTranslationDraft = Required<LandingTranslationOverlay>;

const TRANSLATION_LOCALES = [
  "en",
  "es",
] as const satisfies readonly AppLocale[];
const TRANSLATABLE_FIELDS = [
  "landingModelName",
  "landingSubtitle",
  "landingDescription",
] as const satisfies readonly (keyof LandingTranslationOverlay)[];

function readObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function sanitizeOverlay(
  value: unknown,
): LandingTranslationOverlay | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const result: LandingTranslationOverlay = {};
  for (const field of TRANSLATABLE_FIELDS) {
    const translatedValue = readString(input[field]);
    if (translatedValue !== undefined) result[field] = translatedValue;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function sanitizeLandingTranslations(
  value: unknown,
): LandingTranslations | undefined {
  const input = readObject(value);
  if (!input) return undefined;

  const result: LandingTranslations = {};
  for (const locale of TRANSLATION_LOCALES) {
    const overlay = sanitizeOverlay(input[locale]);
    if (overlay) result[locale] = overlay;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function localizeLandingMetadata<T extends LandingTextMetadata>(
  source: T,
  locale: AppLocale,
): LocalizedLandingMetadata<T> {
  if (locale === "pt") return { ...source };

  const overlay = sanitizeLandingTranslations(source.landingTranslations)?.[
    locale
  ];
  if (!overlay) return { ...source };

  return {
    ...source,
    ...overlay,
  };
}

export function buildLandingTranslationDraft(
  source: LandingTextMetadata,
  locale: AppLocale,
): LandingTranslationDraft {
  const values =
    locale === "pt"
      ? source
      : (sanitizeLandingTranslations(source.landingTranslations)?.[locale] ??
        {});

  return {
    landingModelName: values.landingModelName ?? "",
    landingSubtitle: values.landingSubtitle ?? "",
    landingDescription: values.landingDescription ?? "",
  };
}

export function applyLandingTranslationDraft(
  translations: unknown,
  locale: LandingTranslationLocale,
  draft: LandingTranslationDraft,
): LandingTranslations | undefined {
  const current = sanitizeLandingTranslations(translations) ?? {};
  const overlay = sanitizeOverlay(draft);
  const next: LandingTranslations = { ...current };

  if (overlay) next[locale] = overlay;
  else delete next[locale];

  return Object.keys(next).length > 0 ? next : undefined;
}
