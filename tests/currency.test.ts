import { describe, expect, it } from "vitest";
import {
  currencyForCountry,
  deriveCents,
  isSupportedCurrency,
  BASE_CURRENCY,
  FALLBACK_CURRENCY,
} from "@/lib/currency/config";

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
