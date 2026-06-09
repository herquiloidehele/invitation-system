// Markets we explicitly serve, in hero display order. Mirrors the currency
// markets in lib/currency/config.ts: PT and ES are the EUR markets; the rest
// each map to their own currency. The "other countries" case is communicated
// separately in the hero, so it is intentionally not part of this list.
export const SERVED_COUNTRY_CODES = ["PT", "ES", "BR", "AO", "MZ", "US"] as const;

export type ServedCountryCode = (typeof SERVED_COUNTRY_CODES)[number];
