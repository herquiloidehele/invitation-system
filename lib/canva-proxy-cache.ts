export const CANVA_PROXY_HTML_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export const CANVA_PROXY_IMMUTABLE_ASSET_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

export const CANVA_PROXY_ERROR_CACHE_CONTROL = "no-store";

const STATIC_ASSET_EXTENSION_RE =
  /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|mp3|json)$/i;

/**
 * Shared predicate for paths whose responses Canva treats as
 * content-addressed / hashed assets. Used both for the HTTP
 * `Cache-Control` selection and for the Next data cache TTL so the two
 * stay aligned by construction.
 */
export function isImmutableAssetPath(upstreamPath: string): boolean {
  return (
    /\/_assets\//.test(upstreamPath) ||
    STATIC_ASSET_EXTENSION_RE.test(upstreamPath)
  );
}

interface CanvaProxyCacheControlInput {
  upstreamPath: string;
  isHtml: boolean;
  upstreamCacheControl: string | null;
}

export function pickCanvaProxyCacheControl({
  upstreamPath,
  isHtml,
  upstreamCacheControl,
}: CanvaProxyCacheControlInput): string {
  if (isHtml) {
    return CANVA_PROXY_HTML_CACHE_CONTROL;
  }

  if (isImmutableAssetPath(upstreamPath)) {
    return CANVA_PROXY_IMMUTABLE_ASSET_CACHE_CONTROL;
  }

  return upstreamCacheControl ?? "no-store";
}

interface CanvaProxyFetchInitInput {
  upstreamPath: string;
  host: string;
}

/**
 * Returns the subset of `fetch` `RequestInit` options that opt the
 * upstream Canva fetch into Next.js's data cache with appropriate
 * revalidation. Tags are emitted so `/api/admin/canva-proxy/revalidate`
 * can bust the cache via `revalidateTag`.
 *
 * - Immutable assets are cached for 1 year (matches the response
 *   `Cache-Control: max-age=31536000, immutable`).
 * - HTML and unknown paths are cached for 5 minutes (matches the
 *   response `s-maxage=300`).
 */
export function pickCanvaProxyFetchInit({
  upstreamPath,
  host,
}: CanvaProxyFetchInitInput): {
  next: { revalidate: number; tags: string[] };
} {
  const tags = ["canva-proxy", `canva-proxy:${host}`];
  if (isImmutableAssetPath(upstreamPath)) {
    return { next: { revalidate: 31536000, tags } };
  }
  return { next: { revalidate: 300, tags } };
}
