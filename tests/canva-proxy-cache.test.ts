import { describe, expect, it } from "vitest";
import {
  CANVA_PROXY_ERROR_CACHE_CONTROL,
  pickCanvaProxyCacheControl,
} from "@/lib/canva-proxy-cache";

describe("pickCanvaProxyCacheControl", () => {
  it("uses Cloudflare-friendly caching for HTML", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/",
        isHtml: true,
        upstreamCacheControl: "no-store",
      }),
    ).toBe("public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  });

  it("uses immutable caching for Canva hashed asset paths", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/_assets/app.abc123.js",
        isHtml: false,
        upstreamCacheControl: "no-store",
      }),
    ).toBe("public, max-age=31536000, immutable");
  });

  it("uses immutable caching for common static file extensions", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/fonts/wedding.woff2",
        isHtml: false,
        upstreamCacheControl: null,
      }),
    ).toBe("public, max-age=31536000, immutable");

    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/images/cover.avif",
        isHtml: false,
        upstreamCacheControl: null,
      }),
    ).toBe("public, max-age=31536000, immutable");
  });

  it("preserves upstream cache control for unknown non-HTML responses", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/api/config",
        isHtml: false,
        upstreamCacheControl: "public, max-age=60",
      }),
    ).toBe("public, max-age=60");
  });

  it("uses no-store for unknown non-HTML responses without upstream caching", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/api/config",
        isHtml: false,
        upstreamCacheControl: null,
      }),
    ).toBe("no-store");
  });
});

describe("CANVA_PROXY_ERROR_CACHE_CONTROL", () => {
  it("keeps proxy-generated errors out of shared caches", () => {
    expect(CANVA_PROXY_ERROR_CACHE_CONTROL).toBe("no-store");
  });
});
