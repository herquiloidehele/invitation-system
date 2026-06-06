import { describe, expect, it } from "vitest";
import { formatLandingPrice, resolveLandingPrice } from "../lib/landing-price";

// Intl pt-PT currency formatting separates the amount and the € symbol with a
// non-breaking space (U+00A0), written explicitly as   in the literals below.

describe("formatLandingPrice", () => {
  it("formats a whole-euro amount with the Desde prefix and no decimals", () => {
    expect(formatLandingPrice(14900, "EUR")).toBe("Desde 149 €");
  });

  it("returns null for null, zero, or negative amounts", () => {
    expect(formatLandingPrice(null, "EUR")).toBeNull();
    expect(formatLandingPrice(0, "EUR")).toBeNull();
    expect(formatLandingPrice(-100, "EUR")).toBeNull();
  });
});

describe("resolveLandingPrice", () => {
  it("returns base-only price when there is no discount", () => {
    expect(resolveLandingPrice(14900, null, "EUR")).toEqual({
      amountLabel: "Desde 149 €",
      originalLabel: null,
      discountPercent: null,
    });
  });

  it("returns struck original + sale price + percent for a valid discount", () => {
    expect(resolveLandingPrice(20000, 15000, "EUR")).toEqual({
      amountLabel: "Desde 150 €",
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
    expect(resolveLandingPrice(10000, 10000, "EUR")).toEqual({
      amountLabel: "Desde 100 €",
      originalLabel: null,
      discountPercent: null,
    });
    expect(resolveLandingPrice(10000, 12000, "EUR")).toEqual({
      amountLabel: "Desde 100 €",
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

  it("keeps two decimals for fractional amounts", () => {
    expect(resolveLandingPrice(14950, null, "EUR")?.amountLabel).toBe(
      "Desde 149,50 €",
    );
  });
});
