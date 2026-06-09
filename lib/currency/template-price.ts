import { z } from "zod";

import { BASE_CURRENCY, deriveCents, type Currency } from "./config";

// EUR is the base price itself, so only the four non-base currencies are overridable.
export const OVERRIDE_CURRENCIES = ["MZN", "AOA", "BRL", "USD"] as const;
export type OverrideCurrency = (typeof OVERRIDE_CURRENCIES)[number];

export type PriceOverrideEntry = {
  fromCents: number;
  discountCents?: number | null;
};

export type PriceOverrides = Partial<Record<OverrideCurrency, PriceOverrideEntry>>;

const entrySchema = z
  .object({
    fromCents: z.number().int().positive(),
    discountCents: z.number().int().positive().nullable().optional(),
  })
  .strict();

// `.strict()` rejects unknown keys (e.g. "EUR"), keeping the base out of overrides.
export const priceOverridesSchema = z
  .object({
    MZN: entrySchema.optional(),
    AOA: entrySchema.optional(),
    BRL: entrySchema.optional(),
    USD: entrySchema.optional(),
  })
  .strict()
  .nullable()
  .optional();

type BasePrice = {
  priceFromCents: number | null;
  discountPriceFromCents: number | null;
};

/** Resolve a template's amounts (minor units) in the target currency. */
export function getTemplatePriceCents(
  base: BasePrice,
  overrides: PriceOverrides | null | undefined,
  target: Currency,
): { fromCents: number | null; discountCents: number | null } {
  if (base.priceFromCents == null || base.priceFromCents <= 0) {
    return { fromCents: null, discountCents: null };
  }
  if (target === BASE_CURRENCY) {
    return {
      fromCents: base.priceFromCents,
      discountCents: base.discountPriceFromCents ?? null,
    };
  }
  const override = overrides?.[target as OverrideCurrency];
  if (override) {
    return { fromCents: override.fromCents, discountCents: override.discountCents ?? null };
  }
  return {
    fromCents: deriveCents(base.priceFromCents, target),
    discountCents:
      base.discountPriceFromCents != null
        ? deriveCents(base.discountPriceFromCents, target)
        : null,
  };
}
