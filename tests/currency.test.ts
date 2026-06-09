import { describe, expect, it } from "vitest";
import {
  currencyForCountry,
  deriveCents,
  isSupportedCurrency,
  BASE_CURRENCY,
  FALLBACK_CURRENCY,
} from "@/lib/currency/config";
import {
  getTemplatePriceCents,
  priceOverridesSchema,
} from "@/lib/currency/template-price";

describe("currencyForCountry", () => {
  it("maps the four explicit markets", () => {
    expect(currencyForCountry("MZ")).toBe("MZN");
    expect(currencyForCountry("AO")).toBe("AOA");
    expect(currencyForCountry("BR")).toBe("BRL");
    expect(currencyForCountry("US")).toBe("USD");
  });

  it("is case-insensitive", () => {
    expect(currencyForCountry("mz")).toBe("MZN");
  });

  it("falls back to EUR for Eurozone, unknown, null and empty", () => {
    expect(currencyForCountry("PT")).toBe("EUR");
    expect(currencyForCountry("GB")).toBe("EUR");
    expect(currencyForCountry("ZZ")).toBe("EUR");
    expect(currencyForCountry(null)).toBe("EUR");
    expect(currencyForCountry("")).toBe("EUR");
    expect(FALLBACK_CURRENCY).toBe("EUR");
  });
});

describe("deriveCents", () => {
  it("returns the base unchanged for the base currency", () => {
    expect(BASE_CURRENCY).toBe("EUR");
    expect(deriveCents(14900, "EUR")).toBe(14900);
  });

  it("converts an EUR base to clean, step-rounded amounts (in minor units)", () => {
    // 149 € seed: MZN 149*70=10430 -> step 100 -> 10400; AOA 149*950 -> step 500 -> 141500;
    // BRL 149*6.2=923.8 -> step 5 -> 925; USD 149*1.08=160.92 -> step 1 -> 161.
    expect(deriveCents(14900, "MZN")).toBe(1040000);
    expect(deriveCents(14900, "AOA")).toBe(14150000);
    expect(deriveCents(14900, "BRL")).toBe(92500);
    expect(deriveCents(14900, "USD")).toBe(16100);
  });
});

describe("isSupportedCurrency", () => {
  it("accepts the five supported codes and rejects others", () => {
    for (const c of ["EUR", "MZN", "AOA", "BRL", "USD"]) {
      expect(isSupportedCurrency(c)).toBe(true);
    }
    expect(isSupportedCurrency("GBP")).toBe(false);
    expect(isSupportedCurrency("eur")).toBe(false);
    expect(isSupportedCurrency(undefined)).toBe(false);
    expect(isSupportedCurrency(123)).toBe(false);
  });
});

describe("getTemplatePriceCents", () => {
  const base = { priceFromCents: 14900, discountPriceFromCents: null };

  it("returns the base unchanged for EUR", () => {
    expect(getTemplatePriceCents(base, null, "EUR")).toEqual({
      fromCents: 14900,
      discountCents: null,
    });
  });

  it("derives non-base currencies when there is no override", () => {
    expect(getTemplatePriceCents(base, null, "MZN")).toEqual({
      fromCents: 1040000,
      discountCents: null,
    });
    expect(getTemplatePriceCents(base, null, "USD")).toEqual({
      fromCents: 16100,
      discountCents: null,
    });
  });

  it("uses an explicit override instead of deriving", () => {
    const overrides = { MZN: { fromCents: 999900 } };
    expect(getTemplatePriceCents(base, overrides, "MZN")).toEqual({
      fromCents: 999900,
      discountCents: null,
    });
    // a currency without an override still derives
    expect(getTemplatePriceCents(base, overrides, "BRL")).toEqual({
      fromCents: 92500,
      discountCents: null,
    });
  });

  it("derives the discount proportionally when present", () => {
    const withDiscount = { priceFromCents: 14900, discountPriceFromCents: 9900 };
    expect(getTemplatePriceCents(withDiscount, null, "MZN")).toEqual({
      fromCents: 1040000,
      discountCents: 690000, // 99*70=6930 -> step 100 -> 6900 -> minor 690000
    });
  });

  it("returns nulls when there is no base price", () => {
    expect(
      getTemplatePriceCents(
        { priceFromCents: null, discountPriceFromCents: null },
        null,
        "MZN",
      ),
    ).toEqual({ fromCents: null, discountCents: null });
  });
});

describe("priceOverridesSchema", () => {
  it("accepts a valid override map", () => {
    const parsed = priceOverridesSchema.safeParse({
      MZN: { fromCents: 650000 },
      BRL: { fromCents: 54000, discountCents: 49000 },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts null and undefined", () => {
    expect(priceOverridesSchema.safeParse(null).success).toBe(true);
    expect(priceOverridesSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejects the EUR (base) key and non-positive / non-integer amounts", () => {
    expect(priceOverridesSchema.safeParse({ EUR: { fromCents: 100 } }).success).toBe(false);
    expect(priceOverridesSchema.safeParse({ MZN: { fromCents: -1 } }).success).toBe(false);
    expect(priceOverridesSchema.safeParse({ MZN: { fromCents: 1.5 } }).success).toBe(false);
    expect(priceOverridesSchema.safeParse({ MZN: {} }).success).toBe(false);
  });
});
