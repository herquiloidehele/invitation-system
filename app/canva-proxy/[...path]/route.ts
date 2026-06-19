import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import {
  injectIframeHideScrollbarStyle,
  injectIframeNoScrollStyle,
  rewriteCanvaHtmlBase,
  shouldDisableProxiedScroll,
  shouldHideProxiedScrollbar,
} from "@/lib/canva-proxy-html";
import {
  isSharedCacheable,
  pickCanvaProxyCacheControl,
} from "@/lib/canva-proxy-cache";
import {
  compressBuffer,
  createCompressionTransform,
  isCompressibleContentType,
  pickCompressionEncoding,
  type SupportedEncoding,
} from "@/lib/canva-proxy-compression";
import {
  type CachedHtmlResponse,
  type CachedHtmlTemplate,
  htmlResponseCache,
  htmlTemplateCache,
  makeHtmlCacheKey,
  makeTemplateCacheKey,
} from "@/lib/canva-proxy-html-cache";
import {
  applyCanvaPersonalization,
  decodeCanvaPersonalization,
  type CanvaPersonalization,
} from "@/lib/canva-personalization";

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
/*                                                                      */
/*  Performance notes:                                                  */
/*                                                                      */
/*    * Canva's HTML is ~3 MB of inline serialized state and compresses */
/*      ~30x with Brotli. The upstream sends `Content-Encoding: br`     */
/*      which `undici` automatically decodes; this route RE-COMPRESSES  */
/*      the body before responding so the iframe download stays small. */
/*                                                                      */
/*    * The HTML shell is identical for every guest of the same         */
/*      invitation, so it is cached at the shared edge with a 5-minute  */
/*      fresh window and a 24h stale-while-revalidate window. The first */
/*      guest pays the upstream cost; the rest get sub-50ms TTFB.       */
/*                                                                      */
/*    * Hashed `_assets/*` paths (content-hashed) are cached forever    */
/*      both at the browser and at the edge.                            */
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
  // Hop-by-hop / encoding headers that would confuse Next's response
  // stream. We REMOVE these because undici decodes the upstream body
  // before handing it to us, so the original Content-Encoding/Length
  // no longer describe what's on our wire. The proxy then sets its
  // own Content-Encoding when re-compressing.
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  // We always set our own Cache-Control via pickCanvaProxyCacheControl;
  // strip the upstream one so it can't accidentally leak through if we
  // ever change the logic to merge headers.
  "cache-control",
]);

/** Headers we forward from the incoming request to the upstream. */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  // Explicitly advertise Brotli to upstream Canva so we get the smallest
  // server-to-server payload. `undici` decompresses transparently before
  // we see the body, so this is purely a bandwidth optimization.
  "user-agent",
  "range",
  "if-modified-since",
  "if-none-match",
];

function isHostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_HOSTS.some((entry) =>
    typeof entry === "string" ? entry === normalized : entry.test(normalized),
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
  // Always ask upstream for the smallest payload, regardless of what the
  // browser advertised — `undici` will decompress transparently before
  // the body reaches us, and we re-encode ourselves below.
  headers.set("accept-encoding", "br, gzip");
  // Pretend the request originated from the upstream host so referer-based
  // checks on the origin server keep working.
  headers.set("host", host);
  headers.set("referer", `https://${host}/`);
  return headers;
}

function buildResponseHeaders(
  upstream: Response,
  upstreamPath: string,
  contentType: string,
): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const cacheControl = pickCanvaProxyCacheControl({
    upstreamPath,
    upstreamCacheControl: upstream.headers.get("cache-control"),
    contentType,
  });
  headers.set("cache-control", cacheControl);
  if (isSharedCacheable(cacheControl)) {
    // Mirror into platform-specific CDN cache headers so Vercel/Railway
    // edges actually honour the shared cache window even when their
    // default behaviour ignores the public `Cache-Control` mode.
    headers.set("vercel-cdn-cache-control", cacheControl);
    headers.set("cdn-cache-control", cacheControl);
  }

  // Same-origin requests don't strictly need CORS, but Canva's <link> tags
  // include `crossorigin="anonymous"`, which causes the browser to perform a
  // CORS check even on same-origin URLs. Granting `*` keeps those loads happy.
  headers.set("access-control-allow-origin", "*");
  headers.set("x-proxied-by", "canva-proxy");

  // Critical when we re-compress: a cache MUST NOT serve a gzipped body
  // to a br-only client (or vice versa). Set Vary unconditionally so
  // even the "no compression negotiated" responses are bucketed
  // correctly alongside their compressed siblings.
  appendVaryHeader(headers, "accept-encoding");
  return headers;
}

function appendVaryHeader(headers: Headers, value: string): void {
  const existing = headers.get("vary");
  if (!existing) {
    headers.set("vary", value);
    return;
  }
  const tokens = existing
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.includes(value.toLowerCase())) return;
  headers.set("vary", `${existing}, ${value}`);
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

  // Strip the personalization payload before building the upstream URL so
  // guest data never reaches Canva and the shared template key is guest-free.
  const reqSearchParams = new URLSearchParams(req.nextUrl.search);
  const pz = reqSearchParams.get("pz");
  reqSearchParams.delete("pz");
  const cleanedSearch = reqSearchParams.toString()
    ? `?${reqSearchParams.toString()}`
    : "";
  const upstream = buildUpstreamUrl(path ?? [], cleanedSearch);

  if (!upstream) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const acceptEncoding = req.headers.get("accept-encoding");
  const negotiatedEncoding = pickCompressionEncoding(acceptEncoding);
  const disableScroll = shouldDisableProxiedScroll(req.nextUrl);
  const hideScrollbar = shouldHideProxiedScrollbar(req.nextUrl);
  const personalization = decodeCanvaPersonalization(pz);
  const pzSignature = personalization ? (pz as string) : "none";

  // Fast path: a previously rewritten + compressed HTML shell for this exact
  // (url, encoding, scroll, scrollbar) is served straight from memory — no
  // upstream fetch, no ~3 MB string rewrite, no re-compression. Only
  // compressed responses are cached, so this never fires for the
  // uncompressed case.
  if (method === "GET" && negotiatedEncoding) {
    // (1) Compressed body for this exact (url, encoding, flags, payload).
    const compressedCacheKey = makeHtmlCacheKey(
      upstream.url.href,
      negotiatedEncoding,
      disableScroll,
      hideScrollbar,
      pzSignature,
    );
    const cached = htmlResponseCache.get(compressedCacheKey);
    if (cached) {
      return buildCachedHtmlResponse(cached);
    }

    // (2) Shared token-intact template → personalize + compress (no fetch).
    const template = htmlTemplateCache.get(
      makeTemplateCacheKey(upstream.url.href, disableScroll, hideScrollbar),
    );
    if (template) {
      return await buildHtmlFromTemplate({
        template,
        personalization,
        negotiatedEncoding,
        compressedCacheKey,
      });
    }
  }

  let resp: Response;
  try {
    resp = await fetch(upstream.url, {
      method,
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

  const contentType = resp.headers.get("content-type") ?? "";
  const responseHeaders = buildResponseHeaders(
    resp,
    upstream.url.pathname,
    contentType,
  );

  if (method === "HEAD") {
    return new NextResponse(null, {
      status: resp.status,
      headers: responseHeaders,
    });
  }

  // For HTML responses, buffer + rewrite + (optionally) compress.
  if (contentType.toLowerCase().includes("text/html")) {
    return await respondWithHtml({
      upstream: resp,
      upstreamHost: upstream.host,
      upstreamPath: upstream.url.pathname,
      upstreamHref: upstream.url.href,
      reqUrl: req.nextUrl,
      contentType,
      negotiatedEncoding,
      disableScroll,
      hideScrollbar,
      personalization,
      // Only a compressed 200 shell is worth caching: compression bounds the
      // entry to ~90 KB, and a non-200 body must never be reused.
      compressedCacheKey:
        negotiatedEncoding && resp.status === 200
          ? makeHtmlCacheKey(
              upstream.url.href,
              negotiatedEncoding,
              disableScroll,
              hideScrollbar,
              pzSignature,
            )
          : null,
    });
  }

  // Non-HTML: stream through, compressing on the fly when the content
  // type is text-y enough to benefit and the client supports it.
  if (
    negotiatedEncoding &&
    isCompressibleContentType(contentType) &&
    resp.body !== null
  ) {
    return respondWithStreamingCompression({
      upstreamBody: resp.body,
      status: resp.status,
      responseHeaders,
      encoding: negotiatedEncoding,
    });
  }

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: responseHeaders,
  });
}

interface RespondWithHtmlArgs {
  upstream: Response;
  upstreamHost: string;
  upstreamPath: string;
  upstreamHref: string;
  reqUrl: URL;
  contentType: string;
  negotiatedEncoding: SupportedEncoding | null;
  disableScroll: boolean;
  hideScrollbar: boolean;
  personalization: CanvaPersonalization | null;
  /**
   * When non-null AND a real encoding, the compressed body is stored under
   * this key for reuse. Null disables caching (e.g. uncompressed or non-200).
   */
  compressedCacheKey: string | null;
}

async function respondWithHtml({
  upstream,
  upstreamHost,
  upstreamPath,
  upstreamHref,
  reqUrl,
  contentType,
  negotiatedEncoding,
  disableScroll,
  hideScrollbar,
  personalization,
  compressedCacheKey,
}: RespondWithHtmlArgs): Promise<NextResponse> {
  const html = await upstream.text();
  const proxyOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? reqUrl.origin;
  const baseRewritten = rewriteCanvaHtmlBase(
    html,
    upstreamHost,
    proxyOrigin,
    upstreamPath,
  );
  // Layer the optional style injections. These are independent opt-ins:
  //
  //   * `?disableScroll=1` (curtain-canva embed) removes internal scroll
  //     entirely — the iframe is sized to full content height.
  //   * `?hideScrollbar=1` (ExternalLinkPage) keeps the iframe document's
  //     own scroll but hides the scrollbar chrome.
  //
  // The default consumer (e.g. the admin preview) passes neither and gets
  // the Canva page rendered untouched.
  let rewritten = baseRewritten;
  if (disableScroll) {
    rewritten = injectIframeNoScrollStyle(rewritten);
  }
  if (hideScrollbar) {
    rewritten = injectIframeHideScrollbarStyle(rewritten);
  }

  const responseContentType = contentType || "text/html; charset=utf-8";

  // Cache the shared token-intact template (200s only) so other guests skip
  // the upstream fetch + rewrite.
  if (upstream.status === 200) {
    htmlTemplateCache.set(
      makeTemplateCacheKey(upstreamHref, disableScroll, hideScrollbar),
      { html: rewritten, contentType: responseContentType },
    );
  }

  return await buildHtmlFromTemplate({
    template: { html: rewritten, contentType: responseContentType },
    personalization,
    negotiatedEncoding,
    status: upstream.status,
    compressedCacheKey: upstream.status === 200 ? compressedCacheKey : null,
  });
}

interface BuildHtmlFromTemplateArgs {
  template: CachedHtmlTemplate;
  personalization: CanvaPersonalization | null;
  negotiatedEncoding: SupportedEncoding | null;
  status?: number;
  /** When non-null AND a real encoding, the compressed body is cached here. */
  compressedCacheKey: string | null;
}

/**
 * Personalizes a token-intact template, compresses, and (optionally) caches
 * the compressed body. Personalized output (a guest payload) is marked
 * `private` and emits no CDN-cacheable headers; the no-guest shell keeps the
 * public shared-edge policy.
 */
async function buildHtmlFromTemplate({
  template,
  personalization,
  negotiatedEncoding,
  status = 200,
  compressedCacheKey,
}: BuildHtmlFromTemplateArgs): Promise<NextResponse> {
  const personalized = applyCanvaPersonalization(template.html, personalization);

  const cacheControl = personalization
    ? "private, no-store"
    : pickCanvaProxyCacheControl({
        upstreamPath: "/",
        upstreamCacheControl: null,
        contentType: "text/html",
      });

  const headers = new Headers();
  headers.set("content-type", template.contentType);
  headers.set("cache-control", cacheControl);
  if (isSharedCacheable(cacheControl)) {
    headers.set("vercel-cdn-cache-control", cacheControl);
    headers.set("cdn-cache-control", cacheControl);
  }
  headers.set("access-control-allow-origin", "*");
  headers.set("x-proxied-by", "canva-proxy");
  appendVaryHeader(headers, "accept-encoding");

  if (!negotiatedEncoding) {
    return new NextResponse(personalized, { status, headers });
  }

  const compressed = await compressBuffer(personalized, negotiatedEncoding);
  headers.set("content-encoding", negotiatedEncoding);
  headers.set("content-length", String(compressed.length));

  if (compressedCacheKey) {
    htmlResponseCache.set(compressedCacheKey, {
      body: compressed,
      encoding: negotiatedEncoding,
      contentType: template.contentType,
      cacheControl,
    });
  }
  return new NextResponse(compressed as unknown as BodyInit, { status, headers });
}

/**
 * Rebuilds a full HTML response from a cache hit without any upstream
 * contact. Mirrors the header policy of `buildResponseHeaders` for the HTML
 * regime: shared-edge cache window, CORS, the proxy marker, and the
 * `Vary: accept-encoding` bucketing that keeps a br body from being served
 * to a gzip-only client.
 */
function buildCachedHtmlResponse(cached: CachedHtmlResponse): NextResponse {
  const headers = new Headers();
  headers.set("content-type", cached.contentType);
  headers.set("content-encoding", cached.encoding);
  headers.set("content-length", String(cached.body.length));
  headers.set("cache-control", cached.cacheControl);
  if (isSharedCacheable(cached.cacheControl)) {
    headers.set("vercel-cdn-cache-control", cached.cacheControl);
    headers.set("cdn-cache-control", cached.cacheControl);
  }
  headers.set("access-control-allow-origin", "*");
  headers.set("x-proxied-by", "canva-proxy");
  headers.set("x-proxy-cache", "HIT");
  appendVaryHeader(headers, "accept-encoding");

  return new NextResponse(cached.body as unknown as BodyInit, {
    status: 200,
    headers,
  });
}

interface RespondWithStreamingCompressionArgs {
  upstreamBody: ReadableStream<Uint8Array>;
  status: number;
  responseHeaders: Headers;
  encoding: SupportedEncoding;
}

function respondWithStreamingCompression({
  upstreamBody,
  status,
  responseHeaders,
  encoding,
}: RespondWithStreamingCompressionArgs): NextResponse {
  // Bridge Web Stream → Node Transform → Web Stream so we can use Node's
  // streaming Brotli compressor (CompressionStream only supports gzip).
  // The Web→Node bridge spans two distinct ReadableStream typings
  // (DOM vs node:stream/web) which is why the casts are unavoidable.
  const nodeIn = Readable.fromWeb(
    upstreamBody as unknown as Parameters<typeof Readable.fromWeb>[0],
  );
  const transform = createCompressionTransform(encoding);
  const nodeOut = nodeIn.pipe(transform);
  // Node's `Readable.toWeb` returns a `ReadableStream` whose chunk
  // type doesn't line up with the DOM-flavoured `ReadableStream` that
  // NextResponse expects. Cast at the boundary — the bytes are valid.
  const webOut = Readable.toWeb(nodeOut);

  responseHeaders.set("content-encoding", encoding);
  // We don't know the compressed length up front; the framework will
  // emit it via chunked transfer-encoding.
  responseHeaders.delete("content-length");
  return new NextResponse(webOut as unknown as BodyInit, {
    status,
    headers: responseHeaders,
  });
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyCanvaRequest(req, ctx, "HEAD");
}
