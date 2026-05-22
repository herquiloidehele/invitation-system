export const SUPPORTED_LOCALES = ["pt", "en", "es"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "pt";

export function isSupportedLocale(locale: unknown): locale is AppLocale {
  return (
    typeof locale === "string" &&
    SUPPORTED_LOCALES.includes(locale as AppLocale)
  );
}

export function resolveLocale(locale: unknown): AppLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function getDateFormatLocale(locale: AppLocale): string {
  if (locale === "en") return "en-US";
  if (locale === "es") return "es-ES";
  return "pt-PT";
}

export function buildLocaleHref(pathname: string, locale: AppLocale): string {
  const [pathWithSearch, hash = ""] = pathname.split("#", 2);
  const [pathOnly, search = ""] = pathWithSearch.split("?", 2);
  const segments = pathOnly.split("/").filter(Boolean);
  const pathSegments = isSupportedLocale(segments[0])
    ? segments.slice(1)
    : segments;
  const path = `/${pathSegments.join("/")}`;
  const normalizedPath = path === "/" ? "" : path;
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const nextPath = `${prefix}${normalizedPath}` || "/";
  const nextSearch = search ? `?${search}` : "";
  const nextHash = hash ? `#${hash}` : "";

  return `${nextPath}${nextSearch}${nextHash}`;
}
