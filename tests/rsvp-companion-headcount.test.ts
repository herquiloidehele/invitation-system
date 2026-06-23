import { describe, expect, it } from "vitest";

import {
  countAttendingGuests,
  shouldShowRsvpCompanion,
} from "@/lib/rsvp-config";

describe("countAttendingGuests", () => {
  it("counts each attending response as one guest", () => {
    expect(
      countAttendingGuests([
        { attending: true, companion: null },
        { attending: true, companion: "" },
      ]),
    ).toBe(2);
  });

  it("adds one for a non-empty companion", () => {
    expect(countAttendingGuests([{ attending: true, companion: "Maria" }])).toBe(
      2,
    );
  });

  it("ignores whitespace-only companions", () => {
    expect(countAttendingGuests([{ attending: true, companion: "   " }])).toBe(
      1,
    );
  });

  it("excludes declined responses and their companions", () => {
    expect(
      countAttendingGuests([
        { attending: false, companion: "João" },
        { attending: true, companion: "Ana" },
      ]),
    ).toBe(2);
  });

  it("returns 0 for an empty list", () => {
    expect(countAttendingGuests([])).toBe(0);
  });
});

describe("shouldShowRsvpCompanion", () => {
  it("is true only when showCompanion === true", () => {
    expect(shouldShowRsvpCompanion({ showCompanion: true })).toBe(true);
    expect(shouldShowRsvpCompanion({ showCompanion: false })).toBe(false);
    expect(shouldShowRsvpCompanion({})).toBe(false);
    expect(shouldShowRsvpCompanion(null)).toBe(false);
    expect(shouldShowRsvpCompanion(undefined)).toBe(false);
  });
});
