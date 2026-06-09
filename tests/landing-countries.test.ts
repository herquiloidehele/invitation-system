import { describe, expect, it } from "vitest";

import { SERVED_COUNTRY_CODES } from "@/lib/landing-countries";
import {
  SUPPORTED_CURRENCIES,
  currencyForCountry,
} from "@/lib/currency/config";

describe("served countries", () => {
  it("lists exactly the served markets in display order", () => {
    expect(SERVED_COUNTRY_CODES).toEqual(["PT", "ES", "BR", "AO", "MZ", "US"]);
  });

  it("maps every served country to a supported currency", () => {
    for (const code of SERVED_COUNTRY_CODES) {
      expect(SUPPORTED_CURRENCIES).toContain(currencyForCountry(code));
    }
  });
});
