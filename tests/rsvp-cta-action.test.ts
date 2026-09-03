import { describe, expect, it } from "vitest";

import { getRsvpCtaAction } from "@/lib/rsvp-config";

describe("getRsvpCtaAction", () => {
  it("defaults to rsvp when nothing is stored", () => {
    expect(getRsvpCtaAction(undefined)).toBe("rsvp");
    expect(getRsvpCtaAction(null)).toBe("rsvp");
    expect(getRsvpCtaAction({})).toBe("rsvp");
  });

  it("returns calendar for the calendar action", () => {
    expect(getRsvpCtaAction({ ctaAction: "calendar" })).toBe("calendar");
  });

  it("returns inline for the inline action", () => {
    expect(getRsvpCtaAction({ ctaAction: "inline" })).toBe("inline");
  });

  it("falls back to rsvp for unrecognised values", () => {
    expect(getRsvpCtaAction({ ctaAction: "modal" })).toBe("rsvp");
    expect(getRsvpCtaAction({ ctaAction: "INLINE" })).toBe("rsvp");
    expect(getRsvpCtaAction({ ctaAction: 7 })).toBe("rsvp");
  });
});
