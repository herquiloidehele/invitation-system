// Pure urgency-surcharge pricing. The base fee is the single source of truth
// here; the displayed amount is converted through the same rate table + formatter
// as every other landing price, so it stays consistent and updates if rates
// change. No server imports — safe to use from the client FaqSection.

import { CURRENCY_LOCALE, deriveCents, type Currency } from "./config";
import { formatCurrencyAmount } from "@/lib/landing-price";

/** Urgency surcharge in EUR minor units (cents) — the base for every currency. */
export const URGENCY_SURCHARGE_EUR_CENTS = 2500;

/** The urgency fee formatted in `currency`, e.g. "25 €" or "1800 MZN". */
export function formatUrgencySurcharge(currency: Currency): string {
  const cents = deriveCents(URGENCY_SURCHARGE_EUR_CENTS, currency);
  return formatCurrencyAmount(cents, currency, CURRENCY_LOCALE[currency]);
}
