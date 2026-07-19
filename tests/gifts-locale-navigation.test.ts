import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("standard invitation gifts navigation", () => {
  it("passes a locale-less path to the next-intl router", () => {
    const source = readFileSync("components/shared/GiftsSection.tsx", "utf8");

    expect(source).toContain("const href = giftsPagePath(slug, guestToken);");
    expect(source).not.toContain("`/${locale}${giftsPagePath");
  });
});
