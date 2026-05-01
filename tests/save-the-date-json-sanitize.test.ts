import { describe, expect, it } from "vitest";
import { sanitizeJsonField } from "../lib/json-sanitize";
import { Prisma } from "../lib/generated/prisma/client";

describe("sanitizeJsonField (Save the Date use)", () => {
  it("preserves a non-empty object verbatim", () => {
    const obj = {
      enabled: true,
      mediaUrl: "https://x",
      mediaType: "image",
      title: "t",
      description: "d",
    };
    expect(sanitizeJsonField(obj, null)).toEqual(obj);
  });

  it("preserves an envelope object with hex color base", () => {
    const env = { base: "#ffffff" };
    expect(sanitizeJsonField(env, null)).toEqual(env);
  });

  it("returns Prisma.JsonNull for empty string + null fallback", () => {
    expect(sanitizeJsonField("", null)).toBe(Prisma.JsonNull);
  });

  it("returns Prisma.JsonNull for whitespace-only string + null fallback", () => {
    expect(sanitizeJsonField("   ", null)).toBe(Prisma.JsonNull);
  });

  it("returns Prisma.JsonNull for null + null fallback", () => {
    expect(sanitizeJsonField(null, null)).toBe(Prisma.JsonNull);
  });

  it("returns Prisma.JsonNull for undefined + null fallback", () => {
    expect(sanitizeJsonField(undefined, null)).toBe(Prisma.JsonNull);
  });

  it("preserves an object that contains an empty-string property (does NOT recurse)", () => {
    const env = { base: "" };
    expect(sanitizeJsonField(env, null)).toEqual(env);
  });
});
