/**
 * Cache-Control policy for the Canva reverse proxy.
 *
 * Extracted from the route handler so it can be unit-tested without
 * spinning up the runtime, and so the policy can be reasoned about
 * holistically: there are three response regimes (hashed asset, HTML
 * shell, everything else), each with very different cacheability.
 */

/**
 * File extensions that Canva ships from `_assets/` with content-hashed
 * filenames. Filenames embed a hash, so a change in upstream content
 * produces a new URL — safe to cache forever as `immutable`.
 */
const HASHED_ASSET_EXTENSIONS =
  /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|mp3|json)$/i;

const HASHED_ASSET_DIR = /\/_assets\//;

interface PickCacheControlInput {
  /**
   * Upstream URL pathname (e.g. `/seralina-e-milton/helder` or
   * `/seralina-e-milton/_assets/abc123.runtime.js`). Excludes the
   * query string.
   */
  upstreamPath: string;
  /**
   * Cache-Control header value from the upstream response, or null if
   * upstream sent none.
   */
  upstreamCacheControl: string | null;
  /**
   * Content-Type from the upstream response (already normalized, may
   * include `; charset=...`). Used to decide whether the body should
   * be treated as the iframe HTML shell.
   */
  contentType: string;
}

/**
 * Decides the `Cache-Control` value the proxy should emit.
 *
 * Three regimes:
 *
 *   1. Content-hashed assets (`/_assets/...` or extensioned static
 *      files): cache forever as `public, max-age=31536000, immutable`.
 *      Canva's `_assets/*` filenames embed a content hash, so a change
 *      in upstream content produces a new URL, which makes it safe to
 *      tell every layer (browser, CDN edge) to keep them indefinitely.
 *
 *   2. HTML documents: cache at the shared edge with a short fresh
 *      window (`s-maxage=300`) and a long stale-while-revalidate window
 *      (24h). This collapses the per-guest server-to-Canva round-trip
 *      (~700 ms TTFB) into a cached edge response (<50 ms) for every
 *      guest after the first hit. Browser-level cache is intentionally
 *      `max-age=0` so a manual reload always pulls a fresh copy without
 *      sticking on stale HTML the user wants to refresh.
 *
 *   3. Everything else (JSON APIs, exotic types): pass the upstream
 *      Cache-Control through verbatim, with a `no-store` default when
 *      upstream is silent. This is the conservative "do no harm"
 *      branch — we never invent caching policy for content we don't
 *      recognise.
 */
export function pickCanvaProxyCacheControl({
  upstreamPath,
  upstreamCacheControl,
  contentType,
}: PickCacheControlInput): string {
  if (HASHED_ASSET_DIR.test(upstreamPath) || HASHED_ASSET_EXTENSIONS.test(upstreamPath)) {
    return "public, max-age=31536000, immutable";
  }

  const normalizedType = contentType.toLowerCase().split(";")[0].trim();
  if (normalizedType === "text/html") {
    return "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
  }

  return upstreamCacheControl ?? "no-store";
}

/**
 * Returns true when a `Cache-Control` value the proxy is about to send
 * is safe for an intermediary (CDN, Vercel/Railway edge) to cache. Used
 * to decide whether to mirror the value into the platform-specific
 * `CDN-Cache-Control` family of headers.
 */
export function isSharedCacheable(cacheControl: string): boolean {
  const lc = cacheControl.toLowerCase();
  if (lc.includes("no-store")) return false;
  if (lc.includes("private")) return false;
  return lc.includes("public") || lc.includes("s-maxage=") || lc.includes("max-age=");
}
