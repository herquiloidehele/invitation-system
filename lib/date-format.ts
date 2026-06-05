import { getDateFormatLocale, resolveLocale } from "@/i18n/locales";

// ---------------------------------------------------------------------------
// Locale-aware date formatters.
//
// Invitations store the date both as a raw ISO string (`date.iso`) and as
// pre-formatted PT strings (`date.day`, `date.month`, `date.year`,
// `date.dayOfWeek`, `date.display`). The pre-formatted strings are written
// when the owner creates the invitation in Portuguese; they're not enough
// for a guest viewing the invitation in EN or ES.
//
// These helpers re-derive each field from `date.iso` using the URL locale.
// The PT-pre-formatted value is accepted as `fallback` and returned when
// the ISO string is invalid, so we never render an empty value if the
// stored data is malformed.
// ---------------------------------------------------------------------------

function intlFormat(
  iso: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  fallback: string,
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat(
      getDateFormatLocale(resolveLocale(locale)),
      options,
    ).format(d);
  } catch {
    return fallback;
  }
}

/** Long form: "27 de junho de 2026" / "June 27, 2026" / "27 de junio de 2026". */
export function formatLocalizedLongDate(
  iso: string,
  locale: string,
  fallback = "",
): string {
  return intlFormat(
    iso,
    locale,
    { day: "numeric", month: "long", year: "numeric" },
    fallback,
  );
}

/** Month long form: "junho" / "June" / "junio". */
export function formatLocalizedMonthLong(
  iso: string,
  locale: string,
  fallback = "",
): string {
  return intlFormat(iso, locale, { month: "long" }, fallback);
}

/** Month short form: "jun" / "Jun" / "jun". Trailing dot stripped (pt-PT adds one). */
export function formatLocalizedMonthShort(
  iso: string,
  locale: string,
  fallback = "",
): string {
  return intlFormat(iso, locale, { month: "short" }, fallback).replace(
    ".",
    "",
  );
}

/** Day of week long form: "sábado" / "Saturday" / "sábado". */
export function formatLocalizedDayOfWeek(
  iso: string,
  locale: string,
  fallback = "",
): string {
  return intlFormat(iso, locale, { weekday: "long" }, fallback);
}
