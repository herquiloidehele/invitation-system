import { describe, expect, it } from "vitest";

import {
  countAttendingGuests,
  shouldShowRsvpNumAdults,
  shouldShowRsvpNumChildren,
} from "@/lib/rsvp-config";

describe("shouldShowRsvpNumAdults / NumChildren", () => {
  it("default off, true only when explicitly enabled", () => {
    expect(shouldShowRsvpNumAdults({ showNumAdults: true })).toBe(true);
    expect(shouldShowRsvpNumAdults({ showNumAdults: false })).toBe(false);
    expect(shouldShowRsvpNumAdults({})).toBe(false);
    expect(shouldShowRsvpNumAdults(null)).toBe(false);
    expect(shouldShowRsvpNumChildren({ showNumChildren: true })).toBe(true);
    expect(shouldShowRsvpNumChildren({})).toBe(false);
    expect(shouldShowRsvpNumChildren(undefined)).toBe(false);
  });
});

describe("countAttendingGuests with adults/children config", () => {
  it("no config → unchanged 1-per-response + companion", () => {
    expect(
      countAttendingGuests([
        { attending: true },
        { attending: true, companion: "Maria" },
        { attending: false },
      ]),
    ).toBe(3);
  });

  it("adults on: adults + children, companion ignored", () => {
    expect(
      countAttendingGuests(
        [{ attending: true, numAdults: 2, numChildren: 1, companion: "X" }],
        { showNumAdults: true, showNumChildren: true },
      ),
    ).toBe(3);
  });

  it("children on only: 1 + companion + children", () => {
    expect(
      countAttendingGuests(
        [{ attending: true, numChildren: 2, companion: "X" }],
        { showNumChildren: true },
      ),
    ).toBe(4);
  });

  it("both on, missing values → defaults (1 adult + 0 children)", () => {
    expect(
      countAttendingGuests([{ attending: true }], {
        showNumAdults: true,
        showNumChildren: true,
      }),
    ).toBe(1);
  });

  it("declined responses count zero regardless of counts", () => {
    expect(
      countAttendingGuests(
        [{ attending: false, numAdults: 5, numChildren: 5 }],
        { showNumAdults: true, showNumChildren: true },
      ),
    ).toBe(0);
  });

  it("empty list → 0", () => {
    expect(countAttendingGuests([], { showNumAdults: true })).toBe(0);
  });
});
