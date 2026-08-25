import { describe, expect, it } from "vitest";
import { formatLandingPrice, resolveLandingPrice } from "../lib/landing-price";
import { CURRENCY_LOCALE } from "@/lib/currency/config";

// Intl currency formatting separates groups and the symbol with a non-breaking
// space (U+00A0), written explicitly as   in the literals below. Note the
// CLDR rule minimumGroupingDigits=2: amounts under 10 000 are NOT grouped
// (6900 -> "6900"), while 10 400 is.

describe("formatLandingPrice", () => {
  it("formats a whole-euro amount with no prefix and no decimals", () => {
    expect(formatLandingPrice(14900, "EUR")).toBe("149 €");
  });

  it("returns null for null, zero, or negative amounts", () => {
    expect(formatLandingPrice(null, "EUR")).toBeNull();
    expect(formatLandingPrice(0, "EUR")).toBeNull();
    expect(formatLandingPrice(-100, "EUR")).toBeNull();
  });
});

describe("resolveLandingPrice", () => {
  it("returns base-only price when there is no discount", () => {
    expect(resolveLandingPrice(14900, null, "EUR")).toMatchObject({
      amount: "149 €",
      originalLabel: null,
      discountPercent: null,
    });
  });

  it("returns struck original + sale price + percent for a valid discount", () => {
    expect(resolveLandingPrice(20000, 15000, "EUR")).toMatchObject({
      amount: "150 €",
      originalLabel: "200 €",
      discountPercent: 25,
    });
  });

  it("rounds the discount percent with Math.round", () => {
    // 1 - 99/149 = 0.3356 -> 34
    expect(resolveLandingPrice(14900, 9900, "EUR")?.discountPercent).toBe(34);
    // 1 - 99/150 = 0.34 -> 34
    expect(resolveLandingPrice(15000, 9900, "EUR")?.discountPercent).toBe(34);
  });

  it("ignores a discount greater than or equal to the base", () => {
    expect(resolveLandingPrice(10000, 10000, "EUR")).toMatchObject({
      amount: "100 €",
      originalLabel: null,
      discountPercent: null,
    });
    expect(resolveLandingPrice(10000, 12000, "EUR")).toMatchObject({
      amount: "100 €",
      originalLabel: null,
      discountPercent: null,
    });
  });

  it("ignores zero or negative discounts", () => {
    expect(resolveLandingPrice(10000, 0, "EUR")?.originalLabel).toBeNull();
    expect(resolveLandingPrice(10000, -500, "EUR")?.originalLabel).toBeNull();
  });

  it("returns null when there is no base price (a lone discount is meaningless)", () => {
    expect(resolveLandingPrice(null, 9900, "EUR")).toBeNull();
    expect(resolveLandingPrice(0, 9900, "EUR")).toBeNull();
  });

  it("returns null when both are absent", () => {
    expect(resolveLandingPrice(null, null, "EUR")).toBeNull();
  });

  it("exposes the bare amount for typographic styling", () => {
    expect(resolveLandingPrice(20000, 15000, "EUR")?.amount).toBe("150 €");
    expect(resolveLandingPrice(14900, null, "EUR")?.amount).toBe("149 €");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(resolveLandingPrice(14950, null, "EUR")?.amount).toBe("149,50 €");
  });
});

describe("resolveLandingPrice currency-native formatting", () => {
  it("formats each currency with its native symbol/grouping", () => {
    expect(resolveLandingPrice(14900, null, "EUR", CURRENCY_LOCALE.EUR)?.amount).toBe(
      "149 €",
    );
    expect(resolveLandingPrice(16100, null, "USD", CURRENCY_LOCALE.USD)?.amount).toBe(
      "$161",
    );
    expect(resolveLandingPrice(92500, null, "BRL", CURRENCY_LOCALE.BRL)?.amount).toBe(
      "R$ 925",
    );
    expect(resolveLandingPrice(1040000, null, "MZN", CURRENCY_LOCALE.MZN)?.amount).toBe(
      "10 400 MZN",
    );
  });

  it("formats a legacy AOA value as EUR", () => {
    expect(formatLandingPrice(14900, "AOA")).toBe("149 €");
  });

  it("keeps the discount strikethrough valid after currency formatting", () => {
    const p = resolveLandingPrice(1040000, 690000, "MZN", CURRENCY_LOCALE.MZN);
    expect(p?.originalLabel).toBe("10 400 MZN");
    expect(p?.amount).toBe("6900 MZN");
  });
});
