import { describe, expect, it } from "vitest";

import {
  DEFAULT_NEW_BADGE_DAYS,
  defaultNewUntil,
  fromNewUntilDateInput,
  isLandingFeatureNew,
  parseNewUntilInput,
  toNewUntilDateInput,
} from "@/lib/landing-new-badge";

const now = new Date("2026-09-22T12:00:00.000Z");

describe("isLandingFeatureNew", () => {
  it("is new only while newUntil is in the future", () => {
    expect(isLandingFeatureNew(new Date("2026-09-23T00:00:00Z"), now)).toBe(
      true,
    );
    expect(isLandingFeatureNew("2026-09-23T00:00:00Z", now)).toBe(true);
    expect(isLandingFeatureNew(new Date("2026-09-21T00:00:00Z"), now)).toBe(
      false,
    );
    expect(isLandingFeatureNew(now, now)).toBe(false);
  });

  it("is not new without a valid date", () => {
    expect(isLandingFeatureNew(null, now)).toBe(false);
    expect(isLandingFeatureNew(undefined, now)).toBe(false);
    expect(isLandingFeatureNew("not a date", now)).toBe(false);
  });
});

describe("defaultNewUntil", () => {
  it("lasts the default number of days", () => {
    const days =
      (defaultNewUntil(now).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBe(DEFAULT_NEW_BADGE_DAYS);
  });
});

describe("parseNewUntilInput", () => {
  it("distinguishes missing, cleared and set values", () => {
    expect(parseNewUntilInput(undefined)).toEqual({
      ok: true,
      value: undefined,
    });
    expect(parseNewUntilInput(null)).toEqual({ ok: true, value: null });
    expect(parseNewUntilInput("2026-10-22T12:00:00.000Z")).toEqual({
      ok: true,
      value: new Date("2026-10-22T12:00:00.000Z"),
    });
  });

  it("rejects values that are not dates", () => {
    expect(parseNewUntilInput("")).toEqual({ ok: false });
    expect(parseNewUntilInput("tomorrow")).toEqual({ ok: false });
    expect(parseNewUntilInput(123)).toEqual({ ok: false });
    expect(parseNewUntilInput(true)).toEqual({ ok: false });
  });
});

describe("date input conversion", () => {
  it("round-trips a day through the end of that local day", () => {
    const iso = fromNewUntilDateInput("2026-10-22");
    expect(iso).not.toBeNull();
    const date = new Date(iso!);
    expect([date.getHours(), date.getMinutes()]).toEqual([23, 59]);
    expect(toNewUntilDateInput(iso)).toBe("2026-10-22");
  });

  it("rejects malformed or impossible days", () => {
    expect(fromNewUntilDateInput("")).toBeNull();
    expect(fromNewUntilDateInput("22/10/2026")).toBeNull();
    expect(fromNewUntilDateInput("2026-02-30")).toBeNull();
  });

  it("renders an empty input without a date", () => {
    expect(toNewUntilDateInput(null)).toBe("");
    expect(toNewUntilDateInput("garbage")).toBe("");
  });
});
