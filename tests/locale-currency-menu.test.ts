import { describe, expect, it } from "vitest";

import {
  CURRENCY_SYMBOL,
  formatSelectorTrigger,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency/config";

describe("CURRENCY_SYMBOL", () => {
  it("has a non-empty symbol for every supported currency", () => {
    for (const code of SUPPORTED_CURRENCIES) {
      expect(typeof CURRENCY_SYMBOL[code]).toBe("string");
      expect(CURRENCY_SYMBOL[code].length).toBeGreaterThan(0);
    }
  });

  it("uses the expected native glyphs", () => {
    expect(CURRENCY_SYMBOL).toEqual({
      EUR: "€",
      MZN: "MZN",
      AOA: "Kz",
      BRL: "R$",
      USD: "$",
    });
  });
});

describe("formatSelectorTrigger", () => {
  it("renders 'LOCALE · symbol', uppercasing the locale", () => {
    expect(formatSelectorTrigger("en", "EUR")).toBe("EN · €");
    expect(formatSelectorTrigger("pt", "MZN")).toBe("PT · MZN");
    expect(formatSelectorTrigger("es", "USD")).toBe("ES · $");
  });
});
