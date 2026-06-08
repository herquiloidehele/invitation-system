import { describe, expect, it } from "vitest";
import {
  APP_TABLES,
  deriveDirectEndpoint,
  diffCounts,
  formatCountTable,
  parseArgs,
} from "../scripts/migrate-neon-to-railway";

describe("deriveDirectEndpoint", () => {
  it("removes the Neon -pooler suffix from the host", () => {
    const pooled =
      "postgresql://u:p@ep-holy-voice-abxqh79z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
    expect(deriveDirectEndpoint(pooled)).toBe(
      "postgresql://u:p@ep-holy-voice-abxqh79z.eu-west-2.aws.neon.tech/neondb?sslmode=require",
    );
  });

  it("returns the URL unchanged when there is no -pooler suffix", () => {
    const direct =
      "postgresql://u:p@ep-holy-voice-abxqh79z.eu-west-2.aws.neon.tech/neondb?sslmode=require";
    expect(deriveDirectEndpoint(direct)).toBe(direct);
  });
});

describe("parseArgs", () => {
  it("defaults reset to false", () => {
    expect(parseArgs([])).toEqual({ reset: false });
  });

  it("sets reset true when --reset is present", () => {
    expect(parseArgs(["--reset"])).toEqual({ reset: true });
  });
});

describe("APP_TABLES", () => {
  it("contains the 11 application tables and not _prisma_migrations", () => {
    expect(APP_TABLES).toHaveLength(11);
    expect(APP_TABLES).not.toContain("_prisma_migrations");
    expect(APP_TABLES).toContain("InvitationEvent");
  });
});

describe("diffCounts", () => {
  it("flags matching and mismatching counts per table", () => {
    const rows = diffCounts(
      { A: 10, B: 5 },
      { A: 10, B: 4 },
      ["A", "B"] as const,
    );
    expect(rows).toEqual([
      { table: "A", source: 10, target: 10, ok: true },
      { table: "B", source: 5, target: 4, ok: false },
    ]);
  });

  it("treats a missing table as -1 (mismatch)", () => {
    const rows = diffCounts({ A: 3 }, {}, ["A"] as const);
    expect(rows[0]).toEqual({ table: "A", source: 3, target: -1, ok: false });
  });
});

describe("formatCountTable", () => {
  it("renders a header and OK/MISMATCH status per row", () => {
    const out = formatCountTable([
      { table: "A", source: 1, target: 1, ok: true },
      { table: "B", source: 2, target: 9, ok: false },
    ]);
    expect(out).toContain("table");
    expect(out).toContain("OK");
    expect(out).toContain("MISMATCH");
  });
});
