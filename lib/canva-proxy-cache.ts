export const CANVA_PROXY_HTML_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export const CANVA_PROXY_IMMUTABLE_ASSET_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

export const CANVA_PROXY_ERROR_CACHE_CONTROL = "no-store";

const STATIC_ASSET_EXTENSION_RE =
  /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|mp3|json)$/i;

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

  if (
    /\/_assets\//.test(upstreamPath) ||
    STATIC_ASSET_EXTENSION_RE.test(upstreamPath)
  ) {
    return CANVA_PROXY_IMMUTABLE_ASSET_CACHE_CONTROL;
  }

  return upstreamCacheControl ?? "no-store";
}
