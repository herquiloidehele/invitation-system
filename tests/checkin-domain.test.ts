import { describe, it, expect } from "vitest";
import {
  rsvpStatusFromResponses,
  guestPartySize,
  rsvpPartySize,
  clampArrivedCount,
  computeCheckInUpdate,
  parseScannedValue,
} from "@/lib/checkin";

describe("rsvpStatusFromResponses", () => {
  it("returns 'none' when there are no responses", () => {
    expect(rsvpStatusFromResponses([])).toBe("none");
  });
  it("uses the latest response by submittedAt", () => {
    const status = rsvpStatusFromResponses([
      { attending: false, submittedAt: "2026-01-01T10:00:00.000Z" },
      { attending: true, submittedAt: "2026-01-02T10:00:00.000Z" },
    ]);
    expect(status).toBe("confirmed");
  });
  it("returns 'declined' when the latest response is not attending", () => {
    const status = rsvpStatusFromResponses([
      { attending: true, submittedAt: "2026-01-02T10:00:00.000Z" },
      { attending: false, submittedAt: "2026-01-03T10:00:00.000Z" },
    ]);
    expect(status).toBe("declined");
  });
});

describe("party size", () => {
  it("guestPartySize falls back to 1 when totalGuests is null/0", () => {
    expect(guestPartySize(null)).toBe(1);
    expect(guestPartySize(0)).toBe(1);
    expect(guestPartySize(4)).toBe(4);
  });
  it("rsvpPartySize sums adults + children with fallback to 1", () => {
    expect(rsvpPartySize(null, null)).toBe(1);
    expect(rsvpPartySize(2, 1)).toBe(3);
    expect(rsvpPartySize(0, 0)).toBe(1);
  });
});

describe("clampArrivedCount", () => {
  it("defaults to partySize when requested is undefined", () => {
    expect(clampArrivedCount(undefined, 4)).toBe(4);
  });
  it("clamps to >= 0 and rounds", () => {
    expect(clampArrivedCount(-3, 4)).toBe(0);
    expect(clampArrivedCount(2.6, 4)).toBe(3);
  });
  it("allows counts above party size (extra guests show up)", () => {
    expect(clampArrivedCount(6, 4)).toBe(6);
  });
});

describe("computeCheckInUpdate", () => {
  const now = new Date("2026-06-01T20:42:00.000Z");
  it("sets checkedInAt on first check-in", () => {
    const res = computeCheckInUpdate({ checkedInAt: null }, 4, now);
    expect(res.checkedInAt).toEqual(now);
    expect(res.arrivedCount).toBe(4);
  });
  it("preserves the original checkedInAt on update", () => {
    const original = new Date("2026-06-01T20:00:00.000Z");
    const res = computeCheckInUpdate({ checkedInAt: original }, 5, now);
    expect(res.checkedInAt).toEqual(original);
    expect(res.arrivedCount).toBe(5);
  });
});

describe("parseScannedValue", () => {
  it("extracts a guest token from a personal invite URL (?g=)", () => {
    expect(parseScannedValue("https://x.com/ana-leo?g=abc123&n=maria")).toEqual({
      type: "guest",
      token: "abc123",
    });
  });
  it("extracts a pass token from a pass URL (?c=)", () => {
    expect(parseScannedValue("https://x.com/ana-leo/pass?c=tok_9")).toEqual({
      type: "pass",
      token: "tok_9",
    });
  });
  it("treats a bare string as a raw token", () => {
    expect(parseScannedValue("  rawtoken  ")).toEqual({
      type: "raw",
      token: "rawtoken",
    });
  });
  it("returns null for empty input", () => {
    expect(parseScannedValue("")).toBeNull();
    expect(parseScannedValue("   ")).toBeNull();
  });
});
