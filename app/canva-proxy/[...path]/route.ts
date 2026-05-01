import { NextRequest, NextResponse } from "next/server";

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

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  // Same-origin requests don't strictly need CORS, but Canva's <link> tags
  // include `crossorigin="anonymous"`, which causes the browser to perform a
  // CORS check even on same-origin URLs. Granting `*` keeps those loads happy.
  headers.set("access-control-allow-origin", "*");
  headers.set("x-proxied-by", "canva-proxy");
  return headers;
}

/**
 * Rewrites HTML so that relative URLs continue to resolve through the proxy.
 *
 * Canva pages contain `<base href="/<page-slug>/">` and assets referenced as
 * `_assets/foo.css`. The browser would resolve those against our proxy URL,
 * losing the upstream path prefix. To preserve correct asset paths, we
 * replace the upstream `<base>` with one pointing at the proxied equivalent
 * of the same directory, e.g. `/canva-proxy/<host>/<page-slug>/`.
 *
 * If the upstream HTML has no `<base>` tag, we derive the base from the
 * directory portion of the request path.
 */
function rewriteHtml(
  html: string,
  host: string,
  proxyOrigin: string,
  upstreamPath: string,
): string {
  // Try to read the upstream <base href="..."> first — Canva sets one.
  const baseMatch = html.match(/<base\s+[^>]*href=["']([^"']+)["'][^>]*>/i);
  let upstreamBaseDir: string;

  if (baseMatch) {
    // Resolve relative or absolute base hrefs against the upstream URL.
    try {
      const resolved = new URL(baseMatch[1], `https://${host}${upstreamPath}`);
      upstreamBaseDir = resolved.pathname.endsWith("/")
        ? resolved.pathname
        : resolved.pathname.replace(/[^/]*$/, "");
    } catch {
      upstreamBaseDir = upstreamPath.replace(/[^/]*$/, "") || "/";
    }
  } else {
    upstreamBaseDir = upstreamPath.replace(/[^/]*$/, "") || "/";
  }

  const newBaseHref = `${proxyOrigin}/canva-proxy/${host}${upstreamBaseDir}`;
  const newBaseTag = `<base href="${newBaseHref}">`;

  if (baseMatch) {
    return html.replace(/<base\s+[^>]*>/i, newBaseTag);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${newBaseTag}`);
  }
  return newBaseTag + html;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
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
      method: "GET",
      headers: buildRequestHeaders(req, upstream.host),
      redirect: "follow",
      // Don't cache aggressively; let the browser/CDN decide via passed headers.
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: 502 },
    );
  }

  const responseHeaders = buildResponseHeaders(resp);
  const contentType = resp.headers.get("content-type") ?? "";

  // For HTML responses, inject a <base> tag so relative URLs resolve correctly.
  if (contentType.toLowerCase().includes("text/html")) {
    const html = await resp.text();
    const proxyOrigin = req.nextUrl.origin;
    const rewritten = rewriteHtml(
      html,
      upstream.host,
      proxyOrigin,
      upstream.url.pathname,
    );
    responseHeaders.set(
      "content-type",
      contentType || "text/html; charset=utf-8",
    );
    return new NextResponse(rewritten, {
      status: resp.status,
      headers: responseHeaders,
    });
  }

  // For all other content types (CSS, JS, images, fonts), stream through.
  return new NextResponse(resp.body, {
    status: resp.status,
    headers: responseHeaders,
  });
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  // Some browsers issue HEAD probes; reuse GET logic but return no body.
  const res = await GET(req, ctx);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}
