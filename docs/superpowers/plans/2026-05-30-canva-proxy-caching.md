# Canva Proxy Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cache upstream Canva fetches in Next.js's data cache (with on-demand `revalidateTag` invalidation) so the `/canva-proxy/[...path]` route does not hit Canva on every request.

**Architecture:** The Route Handler stays dynamic but the inner `fetch(upstreamCanvaURL, …)` opts into Next's data cache via `next: { revalidate, tags }`. Client-specific request headers (`if-modified-since`, `if-none-match`, `range`, `user-agent`, `accept-language`) are replaced with fixed values so cache entries are shared across clients. Non-HTML responses switch from streaming to buffered so the data cache can persist them. A new authenticated `POST /api/admin/canva-proxy/revalidate` calls `revalidateTag` to bust entries on demand. The host allowlist is extracted to a shared module so both the proxy and the revalidate endpoint can validate hosts.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Vitest (node env), Zod, `next/cache` (`revalidateTag`).

**Spec reference:** `docs/superpowers/specs/2026-05-30-canva-proxy-caching-design.md`

**Note on `middleware.ts` vs `proxy.ts`:** The spec calls it `middleware.ts` (using Next.js's old name). The actual file in this repo is `proxy.ts` — Next 16 renamed it. The matcher already covers `/api/admin/*` and `isProtectedPath` already handles the prefix, so the new admin endpoint is auto-protected. **Do not edit `proxy.ts`.**

---

## File Structure

- **Create** `lib/canva-proxy-hosts.ts` — exports `ALLOWED_HOSTS`, `isHostAllowed`, `canvaProxyRevalidateBodySchema`. Shared by the proxy route and the admin endpoint.
- **Create** `lib/canva-proxy-headers.ts` — exports `buildStableUpstreamHeaders(host)`. Returns a `Headers` instance with fixed UA / Accept-Language / Accept and the rewritten Host/Referer.
- **Create** `app/api/admin/canva-proxy/revalidate/route.ts` — `POST` handler that validates body with Zod and calls `revalidateTag`.
- **Create** `tests/canva-proxy-hosts.test.ts` — tests for `isHostAllowed` and `canvaProxyRevalidateBodySchema`.
- **Create** `tests/canva-proxy-headers.test.ts` — tests for `buildStableUpstreamHeaders`.
- **Modify** `lib/canva-proxy-cache.ts` — add `isImmutableAssetPath` (extract shared predicate) and `pickCanvaProxyFetchInit`; refactor `pickCanvaProxyCacheControl` to use the shared predicate.
- **Modify** `app/canva-proxy/[...path]/route.ts` — drop `force-dynamic`, drop local `ALLOWED_HOSTS`/`isHostAllowed`/`FORWARDED_REQUEST_HEADERS`/`buildRequestHeaders`, drop `signal: req.signal`, add cached fetch options, buffer non-HTML.
- **Modify** `tests/canva-proxy-cache.test.ts` — add tests for `isImmutableAssetPath` and `pickCanvaProxyFetchInit`.

---

## Task 1: Extract host allowlist to a shared module

**Why:** `ALLOWED_HOSTS` and `isHostAllowed` currently live privately in the proxy route. The new admin endpoint needs to validate hosts against the same list. Move first so subsequent tasks have a clean import path.

**Files:**
- Create: `tests/canva-proxy-hosts.test.ts`
- Create: `lib/canva-proxy-hosts.ts`
- Modify: `app/canva-proxy/[...path]/route.ts`

- [ ] **Step 1.1: Write the failing test for `isHostAllowed`**

Create `tests/canva-proxy-hosts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isHostAllowed } from "@/lib/canva-proxy-hosts";

describe("isHostAllowed", () => {
  it("allows canva.site subdomains", () => {
    expect(isHostAllowed("my-design.canva.site")).toBe(true);
    expect(isHostAllowed("foo.canva.site")).toBe(true);
  });

  it("allows my.canva.site subdomains", () => {
    expect(isHostAllowed("design1.my.canva.site")).toBe(true);
  });

  it("allows the brindealstudio.com vanity host", () => {
    expect(isHostAllowed("brindealstudio.com")).toBe(true);
  });

  it("rejects unrelated hosts", () => {
    expect(isHostAllowed("evil.com")).toBe(false);
  });

  it("rejects hosts that merely contain canva.site as a substring", () => {
    expect(isHostAllowed("example.canva.site.evil.com")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isHostAllowed("FOO.CANVA.SITE")).toBe(true);
  });
});
```

- [ ] **Step 1.2: Run the test to confirm it fails**

Run: `npx vitest run tests/canva-proxy-hosts.test.ts`
Expected: FAIL — module `@/lib/canva-proxy-hosts` does not exist.

- [ ] **Step 1.3: Create `lib/canva-proxy-hosts.ts`**

```ts
/**
 * Allowlist for upstream hosts that the Canva reverse proxy is willing to
 * fetch from. Shared between `app/canva-proxy/[...path]/route.ts` and
 * `app/api/admin/canva-proxy/revalidate/route.ts` so the proxy and the cache
 * revalidation endpoint apply the same validation.
 */
export const ALLOWED_HOSTS: ReadonlyArray<string | RegExp> = [
  /^[a-z0-9-]+\.canva\.site$/i,
  /^[a-z0-9-]+\.my\.canva\.site$/i,
  "brindealstudio.com",
];

export function isHostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_HOSTS.some((entry) =>
    typeof entry === "string"
      ? entry === normalized
      : entry.test(normalized),
  );
}
```

- [ ] **Step 1.4: Run the test to confirm it passes**

Run: `npx vitest run tests/canva-proxy-hosts.test.ts`
Expected: PASS — all 6 cases green.

- [ ] **Step 1.5: Update the proxy route to import from the shared module**

In `app/canva-proxy/[...path]/route.ts`:

Delete the `ALLOWED_HOSTS` block (the JSDoc comment plus the const) and the `isHostAllowed` function. Leave `STRIPPED_RESPONSE_HEADERS` and `FORWARDED_REQUEST_HEADERS` in place — they get cleaned up in Task 4.

Block 1 to delete:

```ts
/**
 * Hosts that we are willing to proxy. Add custom Canva domains here.
 * The first path segment of the proxy URL must match one of these.
 */
const ALLOWED_HOSTS: ReadonlyArray<string | RegExp> = [
  /^[a-z0-9-]+\.canva\.site$/i,
  /^[a-z0-9-]+\.my\.canva\.site$/i,
  "brindealstudio.com",
];
```

Block 2 to delete:

```ts
function isHostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_HOSTS.some((entry) =>
    typeof entry === "string"
      ? entry === normalized
      : entry.test(normalized),
  );
}
```

Add this import alongside the existing imports at the top of the file:

```ts
import { isHostAllowed } from "@/lib/canva-proxy-hosts";
```

- [ ] **Step 1.6: Run lint and the full test suite to confirm the refactor**

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: all tests pass (existing `tests/canva-proxy.test.ts`, `tests/canva-proxy-cache.test.ts`, etc. plus the new `tests/canva-proxy-hosts.test.ts`).

- [ ] **Step 1.7: Commit**

```bash
git add lib/canva-proxy-hosts.ts tests/canva-proxy-hosts.test.ts app/canva-proxy/[...path]/route.ts
git commit -m "extract canva-proxy host allowlist to lib"
```

---

## Task 2: Add `isImmutableAssetPath` and `pickCanvaProxyFetchInit`

**Why:** The data-cache TTL and the response `Cache-Control` should be driven by the same asset-path heuristic. Extract the shared predicate, then add the helper that returns the fetch `next: { revalidate, tags }` shape.

**Files:**
- Modify: `tests/canva-proxy-cache.test.ts`
- Modify: `lib/canva-proxy-cache.ts`

- [ ] **Step 2.1: Add failing tests for the new helpers**

Append the following imports and describe blocks to `tests/canva-proxy-cache.test.ts`. The existing import line becomes:

```ts
import {
  CANVA_PROXY_ERROR_CACHE_CONTROL,
  isImmutableAssetPath,
  pickCanvaProxyCacheControl,
  pickCanvaProxyFetchInit,
} from "@/lib/canva-proxy-cache";
```

After the existing `describe("CANVA_PROXY_ERROR_CACHE_CONTROL", …)` block, append:

```ts
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
```

- [ ] **Step 2.2: Run the tests to confirm the new ones fail**

Run: `npx vitest run tests/canva-proxy-cache.test.ts`
Expected: existing tests pass; new `isImmutableAssetPath` / `pickCanvaProxyFetchInit` tests fail (named exports missing).

- [ ] **Step 2.3: Add the helpers and refactor `pickCanvaProxyCacheControl`**

Replace the entire contents of `lib/canva-proxy-cache.ts` with:

```ts
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
```

- [ ] **Step 2.4: Run the tests to confirm everything passes**

Run: `npx vitest run tests/canva-proxy-cache.test.ts`
Expected: all blocks (`pickCanvaProxyCacheControl`, `CANVA_PROXY_ERROR_CACHE_CONTROL`, `isImmutableAssetPath`, `pickCanvaProxyFetchInit`) pass.

- [ ] **Step 2.5: Commit**

```bash
git add lib/canva-proxy-cache.ts tests/canva-proxy-cache.test.ts
git commit -m "add pickCanvaProxyFetchInit for next data cache"
```

---

## Task 3: Add `buildStableUpstreamHeaders`

**Why:** Forwarding client headers makes upstream responses vary per request, defeating shared caching. Stable headers ensure all clients hit the same cache entry. `if-modified-since` / `if-none-match` / `range` would also cause Canva to return 304/206 which corrupts the data cache.

**Files:**
- Create: `tests/canva-proxy-headers.test.ts`
- Create: `lib/canva-proxy-headers.ts`

- [ ] **Step 3.1: Write the failing test**

Create `tests/canva-proxy-headers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildStableUpstreamHeaders } from "@/lib/canva-proxy-headers";

describe("buildStableUpstreamHeaders", () => {
  it("sets a fixed user-agent", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("user-agent")).toBe("canva-proxy/1.0");
  });

  it("sets a fixed accept-language", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("accept-language")).toBe("pt-BR,pt;q=0.9,en;q=0.8");
  });

  it("sets accept */*", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("accept")).toBe("*/*");
  });

  it("rewrites host and referer to the upstream host", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("host")).toBe("foo.canva.site");
    expect(h.get("referer")).toBe("https://foo.canva.site/");
  });

  it("does not include cache-defeating client headers", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("if-modified-since")).toBeNull();
    expect(h.get("if-none-match")).toBeNull();
    expect(h.get("range")).toBeNull();
  });

  it("does not include propagated cookies", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("cookie")).toBeNull();
  });
});
```

- [ ] **Step 3.2: Run the test to confirm it fails**

Run: `npx vitest run tests/canva-proxy-headers.test.ts`
Expected: FAIL — module `@/lib/canva-proxy-headers` does not exist.

- [ ] **Step 3.3: Create the helper**

Create `lib/canva-proxy-headers.ts`:

```ts
/**
 * Builds the request headers we send upstream to Canva.
 *
 * Stability is the point: all clients share one cached upstream entry,
 * so any header that varies per request would either bust caching or
 * (worse) corrupt the cached entry. We drop:
 *
 *   - `if-modified-since`, `if-none-match` — Canva would respond 304
 *     with no body, which is not what we want stored in the cache.
 *   - `range` — Canva would respond 206 (partial content).
 *   - `user-agent`, `accept-language`, `cookie` and any other client
 *     header — they would vary per client.
 *
 * `host` and `referer` are rewritten so origin-side referer checks on
 * the Canva CDN keep working.
 */
const STABLE_USER_AGENT = "canva-proxy/1.0";
const STABLE_ACCEPT_LANGUAGE = "pt-BR,pt;q=0.9,en;q=0.8";
const STABLE_ACCEPT = "*/*";

export function buildStableUpstreamHeaders(host: string): Headers {
  const headers = new Headers();
  headers.set("user-agent", STABLE_USER_AGENT);
  headers.set("accept-language", STABLE_ACCEPT_LANGUAGE);
  headers.set("accept", STABLE_ACCEPT);
  headers.set("host", host);
  headers.set("referer", `https://${host}/`);
  return headers;
}
```

- [ ] **Step 3.4: Run the test to confirm it passes**

Run: `npx vitest run tests/canva-proxy-headers.test.ts`
Expected: PASS — all 6 cases green.

- [ ] **Step 3.5: Commit**

```bash
git add lib/canva-proxy-headers.ts tests/canva-proxy-headers.test.ts
git commit -m "add buildStableUpstreamHeaders for canva-proxy"
```

---

## Task 4: Wire the proxy route to use the new helpers

**Why:** This is the actual caching change. Remove `force-dynamic`, swap forwarded headers for stable ones, drop `req.signal`, add `next.revalidate`/`next.tags` to the GET fetch, and buffer non-HTML responses so they can populate the data cache.

**Files:**
- Modify: `app/canva-proxy/[...path]/route.ts`

There is no unit test for the route handler in this project (route handlers aren't part of the vitest setup; the existing `tests/canva-proxy.test.ts` covers `getExternalInvitationEmbedSrc`, not the route). Verification is via lint + `tsc --noEmit` + `npm test` + a `next build`. Manual smoke verification is in Task 7.

- [ ] **Step 4.1: Replace the route handler with the cached version**

Replace the entire contents of `app/canva-proxy/[...path]/route.ts` with:

```ts
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
```

Key diffs from the previous version:
- Removed `export const dynamic = "force-dynamic"` (was at the top).
- Removed local `ALLOWED_HOSTS` const and `isHostAllowed` function (already moved in Task 1; this just confirms they're gone).
- Removed `FORWARDED_REQUEST_HEADERS` and `buildRequestHeaders` (replaced by `buildStableUpstreamHeaders`).
- Added `cacheInit` branch (GET → cached, HEAD → `cache: 'no-store'`) and spread into `fetch`.
- Removed `signal: req.signal` from the fetch call.
- Non-HTML path now buffers via `await resp.arrayBuffer()` and returns the buffer instead of streaming `resp.body`.

- [ ] **Step 4.2: Run lint, tests, and typecheck**

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: all tests pass.

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4.3: Run a production build to verify Next-side wiring**

Run: `npm run build`
Expected: build succeeds. Watch the route summary output — `/canva-proxy/[...path]` should not be reported as a static / prerendered route (it's still dynamic via request-time API use), and there should be no warnings about unsupported `fetch` cache options.

- [ ] **Step 4.4: Commit**

```bash
git add app/canva-proxy/[...path]/route.ts
git commit -m "cache upstream canva fetch via next data cache"
```

---

## Task 5: Add Zod schema for the revalidate request body

**Why:** The admin endpoint accepts `{ host?: string }`. Validating the host against the same allowlist used by the proxy keeps the two in lockstep. Keeping the schema in `lib/` lets us unit-test it without spinning up the route runtime.

**Files:**
- Modify: `tests/canva-proxy-hosts.test.ts`
- Modify: `lib/canva-proxy-hosts.ts`

- [ ] **Step 5.1: Add failing tests for the schema**

Update the import line at the top of `tests/canva-proxy-hosts.test.ts` to:

```ts
import {
  canvaProxyRevalidateBodySchema,
  isHostAllowed,
} from "@/lib/canva-proxy-hosts";
```

Append after the existing `describe("isHostAllowed", …)` block:

```ts
describe("canvaProxyRevalidateBodySchema", () => {
  it("accepts an empty object (revalidate all)", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.host).toBeUndefined();
    }
  });

  it("accepts an allowed host", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({
      host: "brindealstudio.com",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.host).toBe("brindealstudio.com");
    }
  });

  it("accepts an allowed canva.site subdomain", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({
      host: "my-design.canva.site",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a disallowed host", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({ host: "evil.com" });
    expect(r.success).toBe(false);
  });

  it("rejects a non-string host", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({ host: 123 });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 5.2: Run the tests to confirm the new ones fail**

Run: `npx vitest run tests/canva-proxy-hosts.test.ts`
Expected: existing `isHostAllowed` tests pass; new `canvaProxyRevalidateBodySchema` tests fail (import does not exist).

- [ ] **Step 5.3: Add the schema to `lib/canva-proxy-hosts.ts`**

Add this import at the top of `lib/canva-proxy-hosts.ts`:

```ts
import { z } from "zod";
```

Append at the bottom of the file:

```ts
/**
 * Request body schema for `POST /api/admin/canva-proxy/revalidate`.
 *
 * - Empty object → bust the global `canva-proxy` tag.
 * - `{ host }` where `host` passes `isHostAllowed` → bust the
 *   `canva-proxy:<host>` tag only.
 */
export const canvaProxyRevalidateBodySchema = z.object({
  host: z
    .string()
    .refine(isHostAllowed, "Host not allowed")
    .optional(),
});

export type CanvaProxyRevalidateBody = z.infer<
  typeof canvaProxyRevalidateBodySchema
>;
```

- [ ] **Step 5.4: Run the tests to confirm they pass**

Run: `npx vitest run tests/canva-proxy-hosts.test.ts`
Expected: all `isHostAllowed` and `canvaProxyRevalidateBodySchema` blocks pass.

- [ ] **Step 5.5: Commit**

```bash
git add lib/canva-proxy-hosts.ts tests/canva-proxy-hosts.test.ts
git commit -m "add zod schema for canva-proxy revalidate body"
```

---

## Task 6: Add the admin revalidate endpoint

**Why:** Gives operators a way to bust the data cache immediately after a Canva site is republished, instead of waiting up to 5 minutes for the time-based revalidate.

**Files:**
- Create: `app/api/admin/canva-proxy/revalidate/route.ts`

No vitest coverage — route handlers aren't part of the vitest setup. The Zod schema is already covered by Task 5. Manual curl verification happens in Task 7.

- [ ] **Step 6.1: Create the directory and the route file**

Run: `mkdir -p app/api/admin/canva-proxy/revalidate`

Create `app/api/admin/canva-proxy/revalidate/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { canvaProxyRevalidateBodySchema } from "@/lib/canva-proxy-hosts";

/* ------------------------------------------------------------------ */
/*  Canva Proxy — Cache Revalidation                                    */
/*                                                                      */
/*  Authenticated endpoint (auth handled by proxy.ts via the           */
/*  /api/admin/* matcher) for busting Next.js data-cache entries        */
/*  produced by `app/canva-proxy/[...path]/route.ts`.                  */
/*                                                                      */
/*  Body (JSON):                                                        */
/*    {}                          -> revalidateTag("canva-proxy")      */
/*    { "host": "<allowed>" }     -> revalidateTag(`canva-proxy:<host>`)*/
/*                                                                      */
/*  The host (if provided) must satisfy `isHostAllowed`. This keeps    */
/*  the schema in lockstep with the proxy's own allowlist.             */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    // Empty body / non-JSON body is acceptable — treat as `{}`.
    raw = {};
  }

  const parsed = canvaProxyRevalidateBodySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const tag = parsed.data.host
    ? `canva-proxy:${parsed.data.host}`
    : "canva-proxy";

  revalidateTag(tag);

  return NextResponse.json({ revalidated: true, tag });
}
```

- [ ] **Step 6.2: Verify lint, tests, and typecheck**

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: all existing tests still pass.

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 6.3: Verify the production build picks up the new route**

Run: `npm run build`
Expected: build succeeds and the route summary lists `/api/admin/canva-proxy/revalidate` as a dynamic route handler.

- [ ] **Step 6.4: Commit**

```bash
git add app/api/admin/canva-proxy/revalidate/route.ts
git commit -m "add admin endpoint to revalidate canva-proxy cache"
```

---

## Task 7: End-to-end verification and final checks

**Why:** The route handler isn't unit-tested, so a manual smoke test confirms the caching behavior end-to-end. This task also runs the full verification suite one more time before merging.

**Files:** none (verification only).

- [ ] **Step 7.1: Full verification suite**

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: all tests pass (existing + new).

Run: `npx tsc --noEmit`
Expected: no type errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7.2: Local smoke test of caching behavior**

In one terminal:

```bash
npm run dev
```

In another terminal, hit a Canva-backed invitation URL twice and check the `Age` / response time:

```bash
# First request (cache miss) — should be slower
time curl -s -o /dev/null -D - \
  "http://localhost:3000/canva-proxy/brindealstudio.com" | head -20

# Second request (cache hit) — should be noticeably faster
time curl -s -o /dev/null -D - \
  "http://localhost:3000/canva-proxy/brindealstudio.com" | head -20
```

Expected:
- Both return `200 OK`.
- Both responses include `cache-control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400` and `x-proxied-by: canva-proxy`.
- Second request is materially faster than the first (cache hit).

> **Note:** Next 16 in dev mode may exhibit different cache behavior than production. If the second request isn't faster in dev, repeat the test against the local `npm start` after `npm run build`.

- [ ] **Step 7.3: Smoke test the revalidate endpoint**

Log in via the admin UI (so the browser holds `auth-token`). Then from devtools or with the cookie:

```bash
# Unauthenticated — should be 401
curl -s -o - -w "\nstatus=%{http_code}\n" \
  -X POST "http://localhost:3000/api/admin/canva-proxy/revalidate" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: status=401

# Authenticated, no body — global revalidate
curl -s -o - -w "\nstatus=%{http_code}\n" \
  -X POST "http://localhost:3000/api/admin/canva-proxy/revalidate" \
  -H "Content-Type: application/json" \
  -b "auth-token=<paste-token>" \
  -d '{}'
# Expected: status=200 body={"revalidated":true,"tag":"canva-proxy"}

# Authenticated, per-host
curl -s -o - -w "\nstatus=%{http_code}\n" \
  -X POST "http://localhost:3000/api/admin/canva-proxy/revalidate" \
  -H "Content-Type: application/json" \
  -b "auth-token=<paste-token>" \
  -d '{"host":"brindealstudio.com"}'
# Expected: status=200 body={"revalidated":true,"tag":"canva-proxy:brindealstudio.com"}

# Authenticated, disallowed host
curl -s -o - -w "\nstatus=%{http_code}\n" \
  -X POST "http://localhost:3000/api/admin/canva-proxy/revalidate" \
  -H "Content-Type: application/json" \
  -b "auth-token=<paste-token>" \
  -d '{"host":"evil.com"}'
# Expected: status=400
```

- [ ] **Step 7.4: Confirm the iframe still works**

Open an invitation page in the browser that uses the Canva proxy (e.g., any externalLink invitation slug). Verify:
- The iframe renders Canva content.
- Devtools network panel shows requests to `/canva-proxy/<host>/...` returning 200.
- Fonts and styles load (no CORS errors).
- The `?disableScroll=1` variant (used by curtain-canva embed) still hides the iframe's own scrollbar.

- [ ] **Step 7.5: Final commit if needed**

No code change in this task; nothing to commit. If any small issues surfaced in the smoke tests and were fixed, commit those:

```bash
git status
# If any modified files appear that were fixed during verification:
git add <files>
git commit -m "fix: <what was fixed>"
```
