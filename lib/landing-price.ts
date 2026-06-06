// Pure landing-page price formatting. No data-access imports so this stays a
// fast unit and so the "is this discount valid?" rule lives in exactly one place.

export type LandingPrice = {
  /** Effective price WITH the "Desde" prefix, e.g. "Desde 99 €". */
  amountLabel: string;
  /** Struck-through original WITHOUT prefix, e.g. "149 €". Null unless discounted. */
  originalLabel: string | null;
  /** Rounded percent off, e.g. 33. Null unless discounted. Carried for a future badge. */
  discountPercent: number | null;
};

function formatMoney(cents: number, currency: string, locale: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatLandingPrice(
  cents: number | null | undefined,
  currency: string,
  locale = "pt-PT",
): string | null {
  if (cents == null || cents <= 0) return null;
  return `Desde ${formatMoney(cents, currency, locale)}`;
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
      amountLabel: `Desde ${formatMoney(discountCents, currency, locale)}`,
      originalLabel: formatMoney(base, currency, locale),
      discountPercent: Math.round((1 - discountCents / base) * 100),
    };
  }

  return {
    amountLabel: `Desde ${formatMoney(base, currency, locale)}`,
    originalLabel: null,
    discountPercent: null,
  };
}
