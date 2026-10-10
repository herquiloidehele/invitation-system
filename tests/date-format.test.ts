import { describe, expect, it } from "vitest";

import {
  formatLocalizedDayOfWeek,
  formatLocalizedLongDate,
  formatLocalizedMonthLong,
  formatLocalizedMonthShort,
} from "@/lib/date-format";

// Saturday 27 June 2026.
const ISO = "2026-06-27T15:00:00.000Z";

describe("localized invitation dates", () => {
  it("writes the date in Italian for an Italian guest", () => {
    expect(formatLocalizedLongDate(ISO, "it")).toBe("27 giugno 2026");
    expect(formatLocalizedMonthLong(ISO, "it")).toBe("giugno");
    expect(formatLocalizedMonthShort(ISO, "it")).toBe("giu");
    expect(formatLocalizedDayOfWeek(ISO, "it")).toBe("sabato");
  });

  it("keeps the other languages unchanged", () => {
    expect(formatLocalizedLongDate(ISO, "pt")).toBe("27 de junho de 2026");
    expect(formatLocalizedLongDate(ISO, "en")).toBe("June 27, 2026");
    expect(formatLocalizedLongDate(ISO, "es")).toBe("27 de junio de 2026");
  });

  it("returns the stored text when the date cannot be parsed", () => {
    expect(formatLocalizedLongDate("not-a-date", "it", "27 de Junho")).toBe(
      "27 de Junho",
    );
  });
});
