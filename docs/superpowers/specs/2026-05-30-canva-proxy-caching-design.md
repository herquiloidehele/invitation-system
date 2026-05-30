# Canva Proxy — Next.js Data Cache Integration

## Goal

Cache upstream Canva fetches in Next.js's data cache so the `app/canva-proxy/[...path]/route.ts` reverse proxy does not re-hit Canva on every request. Add a protected admin endpoint to bust the cache on demand when a Canva site is republished.

## Non-goals

- Replacing the existing HTTP-layer `Cache-Control` headers — they stay; data cache stacks on top.
- Caching the HTML rewrite output (`rewriteCanvaHtmlBase` / `injectIframeNoScrollStyle`) — those still run per request. Cheap.
- Caching `HEAD` responses.
- Building an admin UI for revalidation. The endpoint is curl/Postman-callable from an authenticated session.
- Per-client cache variance (per-`User-Agent`, per-`Accept-Language`). All clients share one cached upstream entry.

## Architecture

Two caching layers operate independently:

1. **Next.js data cache** (new): keyed on the URL passed to `fetch`. Stores the upstream Canva response body and headers. Populated by `fetch(url, { next: { revalidate, tags } })` inside the route handler. Shared across server instances on platforms that support it.
2. **HTTP cache** (existing, unchanged): controlled by the `Cache-Control` header the route returns. Lives in the browser and any upstream CDN.

The route handler stays dynamic (it reads `req.headers` / `req.nextUrl.search`); only the upstream `fetch` participates in the data cache.

## Components

### `app/canva-proxy/[...path]/route.ts`

Changes:

- **Remove** `export const dynamic = "force-dynamic"`. This is what currently forces every fetch in the route to `no-store`. Removing it does not make the route statically rendered — request-time API use keeps it dynamic.
- **Replace** `buildRequestHeaders` with `buildStableUpstreamHeaders(host)` (defined in `lib/canva-proxy-headers.ts`, see below).
- **Remove** `signal: req.signal` from the upstream `fetch` call. If the client aborts, we still want the upstream request to finish so the cache entry populates.
- **Add** `pickCanvaProxyFetchInit({ upstreamPath, host })` (defined in `lib/canva-proxy-cache.ts`) and spread its return into the **GET** fetch only. The HEAD fetch stays uncached:

  ```ts
  const cacheInit =
    method === "GET"
      ? pickCanvaProxyFetchInit({
          upstreamPath: upstream.url.pathname,
          host: upstream.host,
        })
      : { cache: "no-store" as const };

  resp = await fetch(upstream.url, {
    method,
    headers: buildStableUpstreamHeaders(upstream.host),
    redirect: "follow",
    ...cacheInit,
  });
  ```

- **For non-HTML responses**, replace the streaming pass-through with a buffered copy:

  ```ts
  const buffer = await resp.arrayBuffer();
  return new NextResponse(buffer, { status: resp.status, headers: responseHeaders });
  ```

  The Next data cache requires the body to be fully read before it persists.

- **HEAD** path keeps the current uncached behavior. `pickCanvaProxyFetchInit` is only spread into the GET fetch.

### `lib/canva-proxy-hosts.ts` (new)

The current `ALLOWED_HOSTS` array and `isHostAllowed` function live privately inside the proxy route. The new revalidate endpoint also needs to validate hosts. Extract them into a shared module:

```ts
export const ALLOWED_HOSTS: ReadonlyArray<string | RegExp> = [
  /^[a-z0-9-]+\.canva\.site$/i,
  /^[a-z0-9-]+\.my\.canva\.site$/i,
  "brindealstudio.com",
];

export function isHostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_HOSTS.some((entry) =>
    typeof entry === "string" ? entry === normalized : entry.test(normalized),
  );
}
```

Import from both `app/canva-proxy/[...path]/route.ts` and the revalidate endpoint. No other behavior change.

### `lib/canva-proxy-cache.ts`

Extend with one helper and one shared predicate:

```ts
export function isImmutableAssetPath(upstreamPath: string): boolean {
  return (
    /\/_assets\//.test(upstreamPath) ||
    STATIC_ASSET_EXTENSION_RE.test(upstreamPath)
  );
}

interface CanvaProxyFetchInitInput {
  upstreamPath: string;
  host: string;
}

export function pickCanvaProxyFetchInit({
  upstreamPath,
  host,
}: CanvaProxyFetchInitInput): { next: { revalidate: number; tags: string[] } } {
  const tags = ["canva-proxy", `canva-proxy:${host}`];
  if (isImmutableAssetPath(upstreamPath)) {
    return { next: { revalidate: 31536000, tags } };
  }
  return { next: { revalidate: 300, tags } };
}
```

Refactor `pickCanvaProxyCacheControl` to use `isImmutableAssetPath` so the data-cache TTL and the response `Cache-Control` stay aligned by construction.

Revalidation values are chosen to match the existing HTTP-cache buckets:
- `300` (5 min) for HTML and unknown paths — matches existing `s-maxage=300`.
- `31536000` (1 year) for hashed assets — matches existing `max-age=31536000, immutable`.

Tag scheme:
- `canva-proxy` — global tag, busts all entries.
- `canva-proxy:${host}` — per-upstream-host tag, busts a single Canva site.

### `lib/canva-proxy-headers.ts` (new)

A pure helper:

```ts
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

This intentionally drops the client's `if-modified-since`, `if-none-match`, and `range` (Canva would return 304/206, corrupting the cache entry) and the client's `user-agent` / `accept-language` (forwarding them produces a different response per client, defeating the shared cache).

### `app/api/admin/canva-proxy/revalidate/route.ts` (new)

- Method: `POST` only.
- Auth: handled by `middleware.ts`. The existing matcher includes `/api/admin/*`, so no middleware change is required.
- Request body (JSON, optional): `{ host?: string }`. Validated with a Zod schema (`canvaProxyRevalidateBodySchema`) that lives in `lib/canva-proxy-hosts.ts` so it can be unit-tested. If `host` is provided it must satisfy `isHostAllowed`; otherwise the endpoint returns 400.
- Behavior:
  - `host` provided → `revalidateTag(\`canva-proxy:${host}\`)`.
  - `host` omitted → `revalidateTag("canva-proxy")`.
- Response: `200 { revalidated: true, tag: string }`.
- On non-POST: 405.
- On invalid body or disallowed host: 400.

## Data flow

```
GET /canva-proxy/<host>/<path>
   ↓
Route handler validates host (ALLOWED_HOSTS)
   ↓
Builds stable upstream headers (no client UA / cache-defeating headers)
   ↓
fetch(<canva URL>, { next: { revalidate, tags } })
   ↓ (cache miss)              ↓ (cache hit)
Canva CDN responds          Next data cache returns stored Response
   ↓                            ↓
Buffer body (HTML → text, else arrayBuffer)
   ↓
HTML rewrite (base tag, optional no-scroll style)
   ↓
NextResponse with Cache-Control header from pickCanvaProxyCacheControl
   ↓
Client / CDN (HTTP cache layer)
```

```
POST /api/admin/canva-proxy/revalidate  (authenticated)
   ↓
Validate body (optional host within ALLOWED_HOSTS)
   ↓
revalidateTag("canva-proxy" or "canva-proxy:${host}")
   ↓
200 { revalidated, tag }
```

## Error handling

| Condition | Behavior |
|-----------|----------|
| Host not in `ALLOWED_HOSTS` | 403, `Cache-Control: no-store` (existing behavior). |
| Upstream `fetch` throws | 502, `Cache-Control: no-store` (existing behavior). |
| Upstream returns 4xx/5xx | Body is forwarded as-is; the response's `Cache-Control` is set by `pickCanvaProxyCacheControl`. The data cache may have stored the failure response; it will revalidate within the configured TTL (≤5 min for HTML). Accepted trade-off. |
| Revalidate endpoint: invalid host in body | 400. |
| Revalidate endpoint: non-POST | 405. |
| Revalidate endpoint: unauthenticated | 401 (handled by `middleware.ts`). |

## Trade-offs being accepted

1. **Per-client variance collapsed.** All clients share one cached upstream entry. Fine for Canva-published static sites.
2. **Cached errors window.** A Canva 5xx can persist in the data cache for up to its TTL (≤5 min). Mitigation deferred until observed.
3. **Aborted client requests still complete server-side.** Lets the cache populate even if the user navigates away. Negligible upstream cost.
4. **HEAD remains uncached.** HEAD requests are rare and cheap; caching them would require parallel cache-key handling without benefit.

## Testing

- `tests/canva-proxy-cache.test.ts` — extend with cases for:
  - `pickCanvaProxyFetchInit` returns 1-year revalidate + both tags for asset paths.
  - `pickCanvaProxyFetchInit` returns 5-minute revalidate + both tags for HTML / unknown paths.
  - Per-host tag includes the host string verbatim.
- `tests/canva-proxy-headers.test.ts` (new) — test `buildStableUpstreamHeaders`:
  - Sets fixed `user-agent`, `accept-language`, `accept`.
  - Sets `host` and `referer` to the upstream host.
  - Does not propagate any client header.
- `tests/canva-proxy-hosts.test.ts` (new) — test:
  - `isHostAllowed` against representative allowed (`foo.canva.site`, `foo.my.canva.site`, `brindealstudio.com`) and disallowed (`evil.com`, `canva.site.evil.com`) hosts. This regression-guards the host allowlist extraction.
  - `canvaProxyRevalidateBodySchema` accepts `{}`, `{ host: "<allowed>" }`, and rejects `{ host: "<disallowed>" }` and non-string `host`.
- Existing `tests/canva-proxy.test.ts` and `tests/canva-proxy-cache.test.ts` continue to pass.

## Out of scope (deferred)

- Admin UI for the revalidate endpoint.
- Stale-while-revalidate at the Next data cache level (the doc page covers HTTP-level SWR, which we already use).
- Bypassing the cache via a query string (`?fresh=1`) for debugging — can be added later if needed.
- Observability hooks (e.g., counting hits vs misses).
