import { NextRequest, NextResponse } from "next/server";
import {
  CANVA_PROXY_ERROR_CACHE_CONTROL,
  pickCanvaProxyCacheControl,
  pickCanvaProxyFetchInit,
} from "@/lib/canva-proxy-cache";
import { buildStableUpstreamHeaders } from "@/lib/canva-proxy-headers";
import {
  injectIframeNoScrollStyle,
  rewriteCanvaHtmlBase,
  shouldDisableProxiedScroll,
} from "@/lib/canva-proxy-html";
import { isHostAllowed } from "@/lib/canva-proxy-hosts";

/* ------------------------------------------------------------------ */
/*  Canva Reverse Proxy                                                 */
/*                                                                      */
/*  Canva-published sites send a strict CSP header:                    */
/*    frame-ancestors 'self' *.canva.com canva.com                     */
/*  which prevents iframing them from any third-party domain.          */
/*                                                                      */
/*  This route proxies the upstream request and strips framing-related */
/*  response headers so the content can be embedded via <iframe>.      */
/*                                                                      */
/*  Caching:                                                            */
/*  - Upstream GET fetches participate in Next.js's data cache via     */
/*    next.revalidate + next.tags. Tagged with `canva-proxy` and       */
/*    `canva-proxy:<host>` so the admin revalidate endpoint can bust   */
/*    entries on demand. See `lib/canva-proxy-cache.ts`.               */
/*  - The route still emits CDN/browser Cache-Control headers; that    */
/*    layer is independent and stacks on top.                          */
/*  - HEAD is not cached — passes through with `cache: 'no-store'`.    */
/*                                                                      */
/*  Only canva-managed hosts are allowed (see lib/canva-proxy-hosts).  */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

/** Headers we strip from the upstream response before returning to the browser. */
const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  // Hop-by-hop / encoding headers that would confuse Next's response stream.
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

function buildUpstreamUrl(
  pathSegments: string[],
  search: string,
): { url: URL; host: string } | null {
  if (pathSegments.length === 0) return null;
  const [host, ...rest] = pathSegments;
  if (!isHostAllowed(host)) return null;

  const path = rest.length === 0 ? "/" : `/${rest.join("/")}`;
  const url = new URL(`https://${host}${path}${search}`);
  return { url, host };
}

function buildResponseHeaders(
  upstream: Response,
  upstreamPath: string,
  isHtml: boolean,
): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set(
    "cache-control",
    pickCanvaProxyCacheControl({
      upstreamPath,
      isHtml,
      upstreamCacheControl: upstream.headers.get("cache-control"),
    }),
  );

  // Same-origin requests don't strictly need CORS, but Canva's <link> tags
  // include `crossorigin="anonymous"`, which causes the browser to perform a
  // CORS check even on same-origin URLs. Granting `*` keeps those loads happy.
  headers.set("access-control-allow-origin", "*");
  headers.set("x-proxied-by", "canva-proxy");
  return headers;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyCanvaRequest(req, { params }, "GET");
}

async function proxyCanvaRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
  method: "GET" | "HEAD",
) {
  const { path } = await params;
  const upstream = buildUpstreamUrl(path ?? [], req.nextUrl.search);

  if (!upstream) {
    return NextResponse.json(
      { error: "Host not allowed" },
      {
        status: 403,
        headers: { "cache-control": CANVA_PROXY_ERROR_CACHE_CONTROL },
      },
    );
  }

  // GET participates in the Next data cache. HEAD opts out — it's rare,
  // body-less, and would otherwise share a cache key with the GET.
  const cacheInit =
    method === "GET"
      ? pickCanvaProxyFetchInit({
          upstreamPath: upstream.url.pathname,
          host: upstream.host,
        })
      : { cache: "no-store" as const };

  let resp: Response;
  try {
    resp = await fetch(upstream.url, {
      method,
      headers: buildStableUpstreamHeaders(upstream.host),
      redirect: "follow",
      // Intentionally NOT forwarding `req.signal`: aborting the upstream
      // fetch when the client navigates away would prevent the data
      // cache entry from populating.
      ...cacheInit,
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      {
        status: 502,
        headers: { "cache-control": CANVA_PROXY_ERROR_CACHE_CONTROL },
      },
    );
  }

  const contentType = resp.headers.get("content-type") ?? "";
  const isHtml = contentType.toLowerCase().includes("text/html");
  const responseHeaders = buildResponseHeaders(
    resp,
    upstream.url.pathname,
    isHtml,
  );

  if (method === "HEAD") {
    return new NextResponse(null, {
      status: resp.status,
      headers: responseHeaders,
    });
  }

  // For HTML responses, rewrite the <base> tag so relative URLs continue
  // to resolve through this proxy. We cannot bypass to the upstream CDN
  // here because Canva does not send `Access-Control-Allow-Origin` and its
  // tags use `crossorigin="anonymous"`. See `rewriteCanvaHtmlBase`.
  if (isHtml) {
    const html = await resp.text();
    const proxyOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
      req.nextUrl.origin;
    const baseRewritten = rewriteCanvaHtmlBase(
      html,
      upstream.host,
      proxyOrigin,
      upstream.url.pathname,
    );
    // Only inject the no-scroll style when the consumer explicitly asks
    // for it (curtain-canva embed appends `?disableScroll=1`). The default
    // ExternalLinkPage renders Canva at fixed size and relies on the
    // iframe document's own scroll, so it must be left untouched.
    const rewritten = shouldDisableProxiedScroll(req.nextUrl)
      ? injectIframeNoScrollStyle(baseRewritten)
      : baseRewritten;
    responseHeaders.set(
      "content-type",
      contentType || "text/html; charset=utf-8",
    );
    return new NextResponse(rewritten, {
      status: resp.status,
      headers: responseHeaders,
    });
  }

  // Non-HTML: buffer the body so the Next data cache can persist it.
  // Streaming `resp.body` directly would consume it before the cache
  // can read it.
  const buffer = await resp.arrayBuffer();
  return new NextResponse(buffer, {
    status: resp.status,
    headers: responseHeaders,
  });
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyCanvaRequest(req, ctx, "HEAD");
}
