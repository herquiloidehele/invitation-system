import { NextRequest, NextResponse } from "next/server";
import {
  injectIframeNoScrollStyle,
  rewriteCanvaHtmlBase,
  shouldDisableProxiedScroll,
} from "@/lib/canva-proxy-html";

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
/*  Usage:                                                              */
/*    /canva-proxy/<host>/<path...>                                     */
/*  Example:                                                            */
/*    /canva-proxy/brindealstudio.com/                                  */
/*    /canva-proxy/brindealstudio.com/assets/foo.css                    */
/*                                                                      */
/*  Only canva-managed hosts are allowed (allowlist).                  */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hosts that we are willing to proxy. Add custom Canva domains here.
 * The first path segment of the proxy URL must match one of these.
 */
const ALLOWED_HOSTS: ReadonlyArray<string | RegExp> = [
  /^[a-z0-9-]+\.canva\.site$/i,
  /^[a-z0-9-]+\.my\.canva\.site$/i,
  "brindealstudio.com",
];

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

/** Headers we forward from the incoming request to the upstream. */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "user-agent",
  "range",
  "if-modified-since",
  "if-none-match",
];

function isHostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_HOSTS.some((entry) =>
    typeof entry === "string"
      ? entry === normalized
      : entry.test(normalized),
  );
}

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

function buildRequestHeaders(req: NextRequest, host: string): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Pretend the request originated from the upstream host so referer-based
  // checks on the origin server keep working.
  headers.set("host", host);
  headers.set("referer", `https://${host}/`);
  return headers;
}

/**
 * Decide a sensible `Cache-Control` and `Vercel-CDN-Cache-Control` for the
 * proxied response.
 *
 * Two cases matter:
 *
 * 1. The framing HTML document. Canva publishes static pages and the iframe
 *    requests the same URL across every viewer of an invitation, so the HTML
 *    is highly cacheable. Canva responds with `no-store`, which is wrong for
 *    our use case. Override with a short `s-maxage` + a generous SWR so the
 *    Vercel CDN serves repeats in <50 ms while revalidating in the background.
 *    The browser still revalidates per visit because there's no client
 *    `max-age` — this lets us roll out edits quickly while still avoiding the
 *    upstream Canva fetch on cached hits.
 *
 * 2. Legacy/hashed asset requests. After the `<base>` rewrite the iframe pulls
 *    assets directly from Canva, so this branch is rarely hit. It remains as a
 *    safety net for any cached HTML still pointing at `/canva-proxy/...assets`
 *    URLs, and for any future code path that explicitly proxies an asset.
 */
function pickCacheControl(
  upstreamPath: string,
  isHtml: boolean,
  upstreamCacheControl: string | null,
): { browser: string; cdn: string | null } {
  if (isHtml) {
    return {
      // Force the browser to revalidate per visit so we can ship corrections
      // (e.g. updated invitation links) without waiting for a TTL to expire.
      browser: "public, max-age=0, must-revalidate",
      // Let the Vercel edge CDN serve cached HTML for 5 minutes and keep
      // serving stale for up to a day while it refreshes in the background.
      cdn: "public, s-maxage=300, stale-while-revalidate=86400",
    };
  }

  const isHashedAsset =
    /\/_assets\//.test(upstreamPath) ||
    /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|mp3|json)$/i.test(
      upstreamPath,
    );

  if (isHashedAsset) {
    const value = "public, max-age=31536000, immutable";
    return { browser: value, cdn: value };
  }

  return {
    browser: upstreamCacheControl ?? "no-store",
    cdn: null,
  };
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

  const cache = pickCacheControl(
    upstreamPath,
    isHtml,
    upstream.headers.get("cache-control"),
  );
  headers.set("cache-control", cache.browser);
  if (cache.cdn) {
    headers.set("vercel-cdn-cache-control", cache.cdn);
  }

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
      { status: 403 },
    );
  }

  let resp: Response;
  try {
    resp = await fetch(upstream.url, {
      method,
      headers: buildRequestHeaders(req, upstream.host),
      redirect: "follow",
      // Forward the client's abort signal so navigations away from the page
      // free this function's upstream connection promptly.
      signal: req.signal,
      // Don't override caching here — the response headers we set
      // (`vercel-cdn-cache-control`) drive CDN behaviour. Letting fetch
      // use its default lets undici's connection pool warm across requests.
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: 502 },
    );
  }

  const contentType = resp.headers.get("content-type") ?? "";
  const isHtml = contentType.toLowerCase().includes("text/html");
  const responseHeaders = buildResponseHeaders(resp, upstream.url.pathname, isHtml);

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

  // For all other content types (rare path post-base-rewrite, kept as a
  // safety net), stream through.
  return new NextResponse(resp.body, {
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
