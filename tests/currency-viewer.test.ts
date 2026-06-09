import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined,
  }),
}));

import { getViewerCurrency } from "@/lib/currency/viewer-currency";

beforeEach(() => cookieStore.clear());

describe("getViewerCurrency", () => {
  it("prefers the explicit currency cookie", async () => {
    cookieStore.set("currency", "BRL");
    cookieStore.set("geo_currency", "MZN");
    expect(await getViewerCurrency()).toBe("BRL");
  });

  it("uses the geo cookie when there is no explicit choice", async () => {
    cookieStore.set("geo_currency", "MZN");
    expect(await getViewerCurrency()).toBe("MZN");
  });

  it("falls back to EUR when no cookie is valid", async () => {
    expect(await getViewerCurrency()).toBe("EUR");
    cookieStore.set("currency", "GBP"); // unsupported
    expect(await getViewerCurrency()).toBe("EUR");
  });
});
