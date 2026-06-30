import { describe, expect, it } from "vitest";

import { isRsvpClosed } from "@/lib/rsvp-config";

describe("isRsvpClosed", () => {
  it("is open (false) when the flag is missing", () => {
    expect(isRsvpClosed({})).toBe(false);
    expect(isRsvpClosed(null)).toBe(false);
    expect(isRsvpClosed(undefined)).toBe(false);
  });

  it("is open (false) when acceptingResponses is true", () => {
    expect(isRsvpClosed({ acceptingResponses: true })).toBe(false);
  });

  it("is closed (true) only when acceptingResponses is exactly false", () => {
    expect(isRsvpClosed({ acceptingResponses: false })).toBe(true);
  });
});
