import { afterEach, describe, expect, it, vi } from "vitest";

import { clientIpFromForwardedFor, lookupCountry } from "@/lib/currency/geo-lookup";

afterEach(() => vi.unstubAllGlobals());

describe("clientIpFromForwardedFor", () => {
  it("returns the first hop", () => {
    expect(clientIpFromForwardedFor("1.2.3.4, 5.6.7.8")).toBe("1.2.3.4");
    expect(clientIpFromForwardedFor("9.9.9.9")).toBe("9.9.9.9");
  });

  it("returns null for empty or missing values", () => {
    expect(clientIpFromForwardedFor(null)).toBeNull();
    expect(clientIpFromForwardedFor("")).toBeNull();
    expect(clientIpFromForwardedFor("  ")).toBeNull();
  });
});

describe("lookupCountry", () => {
  it("returns null without an IP and does not call fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await lookupCountry(null)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses a 2-letter country code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, text: async () => "PT\n" })),
    );
    expect(await lookupCountry("1.2.3.4")).toBe("PT");
  });

  it("returns null on a non-ok response, bad body, or thrown error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, text: async () => "" })));
    expect(await lookupCountry("1.2.3.4")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, text: async () => "not-a-code" })));
    expect(await lookupCountry("1.2.3.4")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network");
    }));
    expect(await lookupCountry("1.2.3.4")).toBeNull();
  });
});
