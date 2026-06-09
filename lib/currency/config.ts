// Pure currency configuration + math. No I/O, no Prisma, no next/* imports —
// safe to import from both server and client components.

export const SUPPORTED_CURRENCIES = ["EUR", "MZN", "AOA", "BRL", "USD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCY: Currency = "EUR";
export const FALLBACK_CURRENCY: Currency = "EUR";

// Cookie names live here (client-safe) so the switcher, middleware and the
// server resolver all share one source of truth.
export const CURRENCY_COOKIE = "currency"; // explicit user choice — always wins
export const GEO_CURRENCY_COOKIE = "geo_currency"; // cached geo guess

export function isSupportedCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  );
}

// Only the non-EUR markets need a mapping; every other country (incl. the whole
// Eurozone) resolves to the EUR fallback, which is exactly the desired behavior.
const COUNTRY_CURRENCY: Record<string, Currency> = {
  MZ: "MZN",
  AO: "AOA",
  BR: "BRL",
  US: "USD",
};

export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return FALLBACK_CURRENCY;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? FALLBACK_CURRENCY;
}

// Hand-maintained EUR-based rates. 1 EUR = N units of the currency. Seeded with
// current approximate rates; per-template overrides cover any inaccuracy.
const EUR_RATES: Record<Currency, number> = {
  EUR: 1,
  MZN: 70,
  AOA: 950,
  BRL: 6.2,
  USD: 1.08,
};

// Round derived MAJOR-unit amounts to a clean step so prices don't read "6 387 MZN".
const ROUND_STEP: Record<Currency, number> = {
  EUR: 1,
  USD: 1,
  BRL: 5,
  MZN: 100,
  AOA: 500,
};

// Formatting locale per currency → native symbol & grouping (R$, Kz, MTn, …).
export const CURRENCY_LOCALE: Record<Currency, string> = {
  EUR: "pt-PT",
  USD: "en-US",
  BRL: "pt-BR",
  MZN: "pt-MZ",
  AOA: "pt-AO",
};

/** Convert an EUR amount in cents to `target` minor units, rounded to a clean step. */
export function deriveCents(baseEurCents: number, target: Currency): number {
  if (target === BASE_CURRENCY) return baseEurCents;
  const major = (baseEurCents / 100) * EUR_RATES[target];
  const step = ROUND_STEP[target];
  const roundedMajor = Math.round(major / step) * step;
  return Math.round(roundedMajor * 100);
}

// Native currency symbol per code — client-safe, used by the selector trigger
// and the currency rows of the merged language/currency menu.
export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  MZN: "MTn",
  AOA: "Kz",
  BRL: "R$",
  USD: "$",
};

/** Compact label for the merged selector trigger, e.g. "EN · €". */
export function formatSelectorTrigger(locale: string, currency: Currency): string {
  return `${locale.toUpperCase()} · ${CURRENCY_SYMBOL[currency]}`;
}
