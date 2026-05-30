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
