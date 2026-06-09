import { describe, expect, it } from "vitest";

import {
  URGENCY_SURCHARGE_EUR_CENTS,
  formatUrgencySurcharge,
} from "@/lib/currency/urgency";

// Intl uses a non-breaking space (U+00A0) for grouping and before the symbol in
// several locales. JS `\s` matches U+00A0, so collapsing whitespace normalizes
// it to a regular space and keeps these assertions all-ASCII and readable.
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

describe("formatUrgencySurcharge", () => {
  it("keeps the base fee at 25 EUR", () => {
    expect(URGENCY_SURCHARGE_EUR_CENTS).toBe(2500);
  });

  it("formats the fee in each supported currency", () => {
    expect(norm(formatUrgencySurcharge("EUR"))).toBe("25 €");
    expect(norm(formatUrgencySurcharge("MZN"))).toBe("1800 MZN");
    expect(norm(formatUrgencySurcharge("AOA"))).toBe("24 000 Kz");
    expect(norm(formatUrgencySurcharge("BRL"))).toBe("R$ 155");
    expect(norm(formatUrgencySurcharge("USD"))).toBe("$27");
  });
});
