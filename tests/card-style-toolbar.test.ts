import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/admin/CardStyleToolbar.tsx", "utf8");

describe("CardStyleToolbar plain mode", () => {
  it("renders the per-section plain-card switch", () => {
    expect(source).toContain("Sem cartão");
    expect(source).toContain("overrides.plain === true");
    expect(source).toContain('set("plain", checked ? true : undefined)');
  });

  it("disables decoration inputs but leaves spacing controls available", () => {
    expect(source.match(/disabled=\{overrides\.plain === true\}/g)).toHaveLength(
      3,
    );
    expect(source).toContain("<SpacingInput");
  });

  it("clears plain mode in the section reset action", () => {
    expect(source).toContain('set("plain", undefined)');
  });
});
