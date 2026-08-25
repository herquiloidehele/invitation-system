// Pure landing-page price formatting. No data-access imports so this stays a
// fast unit and so the "is this discount valid?" rule lives in exactly one place.

import {
  CURRENCY_SYMBOL,
  normalizeCurrency,
  type Currency,
} from "@/lib/currency/config";

export type LandingPrice = {
  /** Effective price, e.g. "99 €". */
  amount: string;
  /** Struck-through original, e.g. "149 €". Null unless discounted. */
  originalLabel: string | null;
  /** Rounded percent off, e.g. 33. Null unless discounted. Carried for a future badge. */
  discountPercent: number | null;
};

/**
 * Format a minor-unit `cents` amount in `currency`. Public so the urgency
 * surcharge (and any other one-off price) reuses the exact same symbol and
 * grouping rules as the landing prices.
 */
export function formatCurrencyAmount(
  cents: number,
  currency: string,
  locale: string,
): string {
  const amount = cents / 100;
  const activeCurrency = normalizeCurrency(currency);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: activeCurrency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
  // Source the symbol from CURRENCY_SYMBOL so prices match the selector (e.g.
  // MZN renders "MZN", not Intl's native "MTn"); Intl still owns the number
  // grouping and symbol placement. Falls back to Intl's own symbol for any
  // currency without an override.
  const symbol = CURRENCY_SYMBOL[activeCurrency as Currency];
  return formatter
    .formatToParts(amount)
    .map((part) => (part.type === "currency" && symbol ? symbol : part.value))
    .join("");
}

export function formatLandingPrice(
  cents: number | null | undefined,
  currency: string,
  locale = "pt-PT",
): string | null {
  if (cents == null || cents <= 0) return null;
  return formatCurrencyAmount(cents, currency, locale);
}

export function resolveLandingPrice(
  baseCents: number | null | undefined,
  discountCents: number | null | undefined,
  currency: string,
  locale = "pt-PT",
): LandingPrice | null {
  const base = baseCents != null && baseCents > 0 ? baseCents : null;
  if (base == null) return null; // no base price -> nothing to show

  if (discountCents != null && discountCents > 0 && discountCents < base) {
    return {
      amount: formatCurrencyAmount(discountCents, currency, locale),
      originalLabel: formatCurrencyAmount(base, currency, locale),
      discountPercent: Math.round((1 - discountCents / base) * 100),
    };
  }

  return {
    amount: formatCurrencyAmount(base, currency, locale),
    originalLabel: null,
    discountPercent: null,
  };
}
