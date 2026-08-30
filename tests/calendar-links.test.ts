import { describe, expect, it } from "vitest";

import { buildGoogleCalendarUrl } from "@/lib/calendar-links";

const date = { iso: "2027-06-12T15:00:00.000Z" } as never;
const location = { name: "Quinta X", address: "Rua Y, Lisboa" } as never;

describe("buildGoogleCalendarUrl", () => {
  it("points at the Google Calendar template endpoint", () => {
    const url = buildGoogleCalendarUrl({ date, location, title: "T", details: "D" });
    expect(url.startsWith("https://calendar.google.com/calendar/render?")).toBe(
      true,
    );
  });

  it("encodes title, details, and a 3-hour window", () => {
    const url = new URL(
      buildGoogleCalendarUrl({ date, location, title: "Ana & Bruno", details: "Venue" }),
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Ana & Bruno");
    expect(url.searchParams.get("details")).toBe("Venue");
    expect(url.searchParams.get("location")).toBe("Quinta X, Rua Y, Lisboa");
    // dates are "<start>/<end>" with end = start + 3h, compact UTC form
    const dates = url.searchParams.get("dates") ?? "";
    expect(dates).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
    const [start, end] = dates.split("/");
    expect(start).toBe("20270612T150000Z");
    expect(end).toBe("20270612T180000Z");
  });
});
