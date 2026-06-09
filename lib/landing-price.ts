// Pure landing-page price formatting. No data-access imports so this stays a
// fast unit and so the "is this discount valid?" rule lives in exactly one place.

import { CURRENCY_SYMBOL, type Currency } from "@/lib/currency/config";

export type LandingPrice = {
  /** Effective price WITH the "Desde" prefix, e.g. "Desde 99 €". */
  amountLabel: string;
  /** Locale "from" prefix on its own, e.g. "Desde" — lets the UI style it quietly. */
  prefix: string;
  /** Effective price WITHOUT the prefix, e.g. "99 €" — lets the UI emphasize the number. */
  amount: string;
  /** Struck-through original WITHOUT prefix, e.g. "149 €". Null unless discounted. */
  originalLabel: string | null;
  /** Rounded percent off, e.g. 33. Null unless discounted. Carried for a future badge. */
  discountPercent: number | null;
};

/** Locale "from" prefix shown before every landing price. */
const LANDING_PRICE_PREFIX = "Desde";

function formatMoney(cents: number, currency: string, locale: string): string {
  const amount = cents / 100;
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
  // Source the symbol from CURRENCY_SYMBOL so prices match the selector (e.g.
  // MZN renders "MZN", not Intl's native "MTn"); Intl still owns the number
  // grouping and symbol placement. Falls back to Intl's own symbol for any
  // currency without an override.
  const symbol = CURRENCY_SYMBOL[currency as Currency];
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
  return `${LANDING_PRICE_PREFIX} ${formatMoney(cents, currency, locale)}`;
}

export function resolveLandingPrice(
  baseCents: number | null | undefined,
  discountCents: number | null | undefined,
  currency: string,
  locale = "pt-PT",
): LandingPrice | null {
  const base = baseCents != null && baseCents > 0 ? baseCents : null;
  if (base == null) return null; // no base price -> nothing to show

  const prefix = LANDING_PRICE_PREFIX;

  if (discountCents != null && discountCents > 0 && discountCents < base) {
    const amount = formatMoney(discountCents, currency, locale);
    return {
      amountLabel: `${prefix} ${amount}`,
      prefix,
      amount,
      originalLabel: formatMoney(base, currency, locale),
      discountPercent: Math.round((1 - discountCents / base) * 100),
    };
  }

  const amount = formatMoney(base, currency, locale);
  return {
    amountLabel: `${prefix} ${amount}`,
    prefix,
    amount,
    originalLabel: null,
    discountPercent: null,
  };
}
