# Canva Proxy CDN Cache Design

## Context

The app embeds external Canva-published invitation sites through `app/canva-proxy/[...path]/route.ts` because Canva sends framing restrictions that block direct third-party iframes. The proxy also rewrites Canva HTML so subresources resolve through the same origin and receive permissive CORS headers.

The app is hosted on Railway. The current proxy sets some Vercel-specific CDN headers, but Railway does not provide the same edge cache behavior. This means repeated Canva iframe loads can still hit the Railway app and Canva upstream, increasing latency and Railway resource usage.

## Goals

- Improve first-visitor behavior for warmed Canva URLs by keeping cached and stale responses available at Cloudflare.
- Improve repeated visitor load time for the same Canva invitation URL.
- Reduce Railway request volume and upstream Canva fetch volume for proxied HTML and assets.
- Preserve the existing iframe compatibility behavior: stripped frame-blocking headers, rewritten Canva base URL, CORS headers, and optional no-scroll HTML injection.

## Non-Goals

- Do not snapshot Canva sites into S3 in this phase.
- Do not add Redis or another server-side cache in this phase.
- Do not change invitation authoring or stored Canva URLs.
- Do not cache admin routes, API routes, or public invitation pages outside `/canva-proxy/*`.

## Recommended Approach

Put Cloudflare in front of the Railway domain and configure it to cache `/canva-proxy/*` according to origin cache headers. Keep Railway as the compatibility proxy and make its cache headers CDN-neutral.

This approach does not remove the very first uncached fetch for a brand-new Canva URL. It improves first-load behavior once the URL has been requested or warmed, and it greatly reduces repeated origin work afterward.

Request flow:

```text
Browser iframe -> Cloudflare -> Railway /canva-proxy/* -> Canva upstream
```

For cache hits, Cloudflare should serve proxied Canva HTML/assets directly without hitting Railway or Canva.

## Proxy Header Behavior

The proxy should emit explicit cache headers that Cloudflare can honor:

- HTML responses: `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`.
- Hashed/static assets: `Cache-Control: public, max-age=31536000, immutable`.
- Unknown non-HTML responses: preserve upstream `Cache-Control` when present, otherwise use `no-store`.
- Proxy errors such as disallowed hosts and upstream fetch failures: `Cache-Control: no-store`.

The proxy should continue to strip frame-blocking and problematic hop-by-hop headers, return `access-control-allow-origin: *`, and return `x-proxied-by: canva-proxy`.

The current `vercel-cdn-cache-control` header should not be the primary cache mechanism for Railway. If retained, it must not be required for correctness.

## Cloudflare Cache Rules

Configure Cloudflare for the production domain with a scoped rule for `/canva-proxy/*`:

- Cache only `GET` and `HEAD` requests.
- Respect origin cache headers or set equivalent edge TTLs matching the proxy policy.
- Include the full query string in the cache key.
- Do not cache 4xx or 5xx responses unless explicitly revisited later.
- Do not broaden this cache rule to non-Canva app routes.

The full query string must remain in the cache key because `?disableScroll=1` changes the returned HTML by injecting no-scroll CSS. A URL with `disableScroll=1` and the same URL without it are different cache entries.

## Data Flow

Cold request:

1. Visitor opens an invitation.
2. The iframe requests `/canva-proxy/<host>/<path>?...`.
3. Cloudflare has no matching cached entry and forwards to Railway.
4. Railway fetches Canva, rewrites/filters the response as it does today, and returns CDN-friendly cache headers.
5. Cloudflare stores the successful response according to the cache policy.
6. The browser renders the iframe.

Repeated request:

1. Visitor requests the same `/canva-proxy/*` URL.
2. Cloudflare serves the cached response directly.
3. Railway and Canva are bypassed except when Cloudflare revalidates or refreshes the cache.

## Error Handling

- Disallowed proxy hosts remain `403` responses.
- Upstream fetch failures remain `502` responses.
- Proxy-generated error responses must use `Cache-Control: no-store`.
- Cloudflare should not cache 4xx/5xx responses by default.

## Observability

Use response headers to verify behavior:

- `cf-cache-status` from Cloudflare shows `MISS`, `HIT`, `REVALIDATED`, or related cache states.
- `x-proxied-by: canva-proxy` confirms that a response came from the proxy on origin-backed requests.
- Optional `Server-Timing` around the upstream Canva fetch can be added later if origin-hit diagnosis remains difficult.

## Testing

Code tests:

- Unit-test cache policy selection for HTML, hashed/static assets, unknown responses, and proxy errors.
- Keep existing tests for Canva URL rewriting, `disableScroll=1`, and iframe measurement.
- Run `npm test` and `npm run lint` after implementation.

CDN verification:

- Request a production `/canva-proxy/*` URL twice and verify the second response becomes `cf-cache-status: HIT`.
- Verify `disableScroll=1` and non-`disableScroll` variants do not share cached HTML.
- Verify iframe rendering still works and fonts/assets are not blocked by CORS.
- Verify Railway request volume drops for repeated Canva loads.

## Rollout

1. Ship the proxy cache-header cleanup.
2. Configure Cloudflare cache rules for `/canva-proxy/*`.
3. Test one production invitation end-to-end.
4. Warm the highest-priority production Canva invitation URLs manually by requesting their `/canva-proxy/*` pages through the production domain.
5. Expand to all traffic.
6. If true cold misses are still a problem, consider a phase-two design for automated cache warming after invitation publish/update or Canva snapshotting into S3/CDN.

## Open Decisions

- Cloudflare will be used as the CDN in front of Railway.
- The first implementation phase will not add Redis, S3 snapshotting, or broad app-level caching.
