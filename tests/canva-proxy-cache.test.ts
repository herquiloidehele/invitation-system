import { describe, expect, it } from "vitest";
import {
  CANVA_PROXY_ERROR_CACHE_CONTROL,
  isImmutableAssetPath,
  pickCanvaProxyCacheControl,
  pickCanvaProxyFetchInit,
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

describe("isImmutableAssetPath", () => {
  it("returns true for Canva _assets paths", () => {
    expect(isImmutableAssetPath("/_assets/app.abc123.js")).toBe(true);
  });

  it("returns true for known static extensions", () => {
    expect(isImmutableAssetPath("/fonts/wedding.woff2")).toBe(true);
    expect(isImmutableAssetPath("/images/cover.avif")).toBe(true);
  });

  it("returns false for HTML / unknown paths", () => {
    expect(isImmutableAssetPath("/")).toBe(false);
    expect(isImmutableAssetPath("/page-1")).toBe(false);
  });
});

describe("pickCanvaProxyFetchInit", () => {
  it("returns 1-year revalidate plus both tags for hashed asset paths", () => {
    expect(
      pickCanvaProxyFetchInit({
        upstreamPath: "/_assets/app.abc.js",
        host: "foo.canva.site",
      }),
    ).toEqual({
      next: {
        revalidate: 31536000,
        tags: ["canva-proxy", "canva-proxy:foo.canva.site"],
      },
    });
  });

  it("returns 5-minute revalidate plus both tags for HTML / unknown paths", () => {
    expect(
      pickCanvaProxyFetchInit({
        upstreamPath: "/page-1",
        host: "foo.canva.site",
      }),
    ).toEqual({
      next: {
        revalidate: 300,
        tags: ["canva-proxy", "canva-proxy:foo.canva.site"],
      },
    });
  });

  it("includes the host in the per-host tag verbatim", () => {
    const init = pickCanvaProxyFetchInit({
      upstreamPath: "/",
      host: "my-design.my.canva.site",
    });
    expect(init.next.tags).toContain(
      "canva-proxy:my-design.my.canva.site",
    );
  });
});
