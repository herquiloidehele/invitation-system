import { describe, expect, it } from "vitest";
import { pickCanvaProxyCacheControl } from "../lib/canva-proxy-cache";

/* ------------------------------------------------------------------ */
/*  pickCanvaProxyCacheControl                                          */
/*                                                                      */
/*  Decides the Cache-Control header for proxied Canva responses.       */
/*  Three regimes:                                                      */
/*                                                                      */
/*    1. Hashed assets (`/_assets/...` or extensioned static files):    */
/*       safe to cache forever as `public, max-age=31536000, immutable` */
/*       because Canva embeds a content hash in the filename.           */
/*                                                                      */
/*    2. HTML documents (mostly the iframe shell): cache at the shared  */
/*       edge with a short fresh window and a long SWR window so that   */
/*       guests of the same invitation reuse the cached document        */
/*       without each one waiting for a full Canva fetch. Browser cache */
/*       is intentionally short (max-age=0) so a manual reload pulls    */
/*       a fresh copy.                                                  */
/*                                                                      */
/*    3. Everything else: pass through the upstream Cache-Control       */
/*       verbatim (with a `no-store` default when upstream is silent).  */
/* ------------------------------------------------------------------ */

describe("pickCanvaProxyCacheControl", () => {
  it("returns long immutable caching for hashed _assets/* paths", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/some-page/_assets/173209abb3c2632f.runtime.js",
        upstreamCacheControl: "no-store",
        contentType: "application/javascript",
      }),
    ).toBe("public, max-age=31536000, immutable");
  });

  it("returns long immutable caching for typical static file extensions", () => {
    const cases = [
      "/page/script.js",
      "/page/style.css",
      "/page/font.woff2",
      "/page/photo.jpg",
      "/page/photo.jpeg",
      "/page/icon.svg",
      "/page/video.mp4",
    ];
    for (const upstreamPath of cases) {
      expect(
        pickCanvaProxyCacheControl({
          upstreamPath,
          upstreamCacheControl: null,
          contentType: "application/octet-stream",
        }),
      ).toBe("public, max-age=31536000, immutable");
    }
  });

  it("returns short SWR caching for HTML documents", () => {
    // HTML is identical for every guest of the same invitation; cache
    // it at the edge for 5 minutes and serve stale for 24h while
    // revalidating in the background. browser stays at max-age=0 so a
    // forced reload still fetches fresh.
    const out = pickCanvaProxyCacheControl({
      upstreamPath: "/seralina-e-milton/helder",
      upstreamCacheControl: "no-store, no-cache",
      contentType: "text/html; charset=utf-8",
    });
    expect(out).toBe(
      "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    );
  });

  it("returns short SWR caching for HTML even when the path looks like a directory", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/",
        upstreamCacheControl: null,
        contentType: "text/html",
      }),
    ).toBe("public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  });

  it("falls back to the upstream Cache-Control verbatim for unknown types", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/api/some-endpoint",
        upstreamCacheControl: "public, max-age=60",
        contentType: "application/json",
      }),
    ).toBe("public, max-age=60");
  });

  it("defaults to no-store when the upstream sent no Cache-Control and type is unknown", () => {
    expect(
      pickCanvaProxyCacheControl({
        upstreamPath: "/api/whatever",
        upstreamCacheControl: null,
        contentType: "application/json",
      }),
    ).toBe("no-store");
  });
});
