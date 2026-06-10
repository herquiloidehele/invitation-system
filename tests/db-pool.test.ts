import { describe, expect, it } from "vitest";

import { readDatabasePoolMax } from "@/lib/db-pool";

describe("readDatabasePoolMax", () => {
  it("returns the configured positive integer", () => {
    expect(readDatabasePoolMax("5")).toBe(5);
  });

  it("falls back to the default for invalid values", () => {
    expect(readDatabasePoolMax(undefined)).toBe(3);
    expect(readDatabasePoolMax("0")).toBe(3);
    expect(readDatabasePoolMax("2.5")).toBe(3);
    expect(readDatabasePoolMax("abc")).toBe(3);
  });
});
