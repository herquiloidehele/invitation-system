import { cookies } from "next/headers";

import {
  CURRENCY_COOKIE,
  FALLBACK_CURRENCY,
  GEO_CURRENCY_COOKIE,
  isSupportedCurrency,
  type Currency,
} from "./config";

/**
 * Resolve the currency for the current request. Precedence:
 *   1. explicit `currency` cookie (set by the switcher) — always wins
 *   2. cached `geo_currency` cookie (set by middleware) — the geo guess
 *   3. EUR fallback
 * Server-only: imports `next/headers`. Never import from a client component.
 */
export async function getViewerCurrency(): Promise<Currency> {
  const jar = await cookies();

  const explicit = jar.get(CURRENCY_COOKIE)?.value;
  if (isSupportedCurrency(explicit)) return explicit;

  const geo = jar.get(GEO_CURRENCY_COOKIE)?.value;
  if (isSupportedCurrency(geo)) return geo;

  return FALLBACK_CURRENCY;
}
