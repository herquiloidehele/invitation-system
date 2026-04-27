import { describe, expect, it } from "vitest";
import { slugifyName } from "../lib/guest-links";

// The slugifier in lib/guests.ts re-uses `slugifyName` from
// lib/guest-links.ts. This file pins down the exact behaviour we depend on
// for the `slugifiedName` DB column and the `?n=` URL param across a wider
// range of inputs than the guest-links test covers.

describe("slugifyName — extended cases", () => {
  it("handles plain ASCII names", () => {
    expect(slugifyName("Maria Silva")).toBe("maria-silva");
  });

  it("strips diacritics", () => {
    expect(slugifyName("José")).toBe("jose");
    expect(slugifyName("Conceição da Silva")).toBe("conceicao-da-silva");
  });

  it("collapses repeated whitespace and dashes", () => {
    expect(slugifyName("João  Pedro")).toBe("joao-pedro");
    expect(slugifyName("Ana--Beatriz")).toBe("ana-beatriz");
  });

  it("trims leading/trailing whitespace", () => {
    expect(slugifyName("  trim me  ")).toBe("trim-me");
  });

  it("returns empty string for empty / dash-only input", () => {
    expect(slugifyName("")).toBe("");
    expect(slugifyName("---")).toBe("");
  });

  it("strips symbols", () => {
    expect(slugifyName("João & Maria")).toBe("joao-maria");
  });

  it("preserves digits", () => {
    expect(slugifyName("Numbers 123")).toBe("numbers-123");
  });

  it("lowercases ASCII", () => {
    expect(slugifyName("UPPER CASE")).toBe("upper-case");
  });
});
