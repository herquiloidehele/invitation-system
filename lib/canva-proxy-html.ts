/**
 * Helpers for transforming the HTML returned by the Canva reverse proxy.
 *
 * Kept in `lib/` so it can be unit-tested without spinning up the route
 * runtime, and reused by `app/canva-proxy/[...path]/route.ts`.
 */

/**
 * Rewrites the proxied Canva HTML's `<base>` tag so that the iframe's
 * subresources continue to resolve through this proxy. We cannot point the
 * `<base>` directly at the upstream Canva CDN because Canva's hosting does
 * not send `Access-Control-Allow-Origin`, and Canva's published HTML tags
 * its scripts/stylesheets with `crossorigin="anonymous"` — those loads
 * would be blocked by CORS. Fonts (`<link rel="preload" as="font">` and
 * CSS `@font-face`) are CORS-required by spec regardless of attributes, so
 * they too need an origin that serves CORS headers.
 *
 * Routing everything through this proxy gives us a single origin that
 * uniformly answers with `Access-Control-Allow-Origin: *` (see
 * `buildResponseHeaders` in the route), at the cost of one round-trip per
 * subresource. Hashed assets are CDN-cached aggressively (one-year
 * `immutable` Cache-Control) so the per-asset cost is paid only on first
 * uncached request per edge node.
 *
 * If Canva's HTML already had a `<base href="...">` it is replaced; if
 * not, a new one is inserted into `<head>` (or prepended to the document
 * if `<head>` is missing).
 */
export function rewriteCanvaHtmlBase(
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

const NO_SCROLL_MARKER = "data-canva-proxy-no-scroll";

/**
 * Style block injected into proxied Canva HTML so the embedded page never
 * scrolls itself. The host iframe is sized to the proxied document's full
 * `scrollHeight`, so the only scroll surface remains the main page.
 *
 * `height: auto !important` is needed because Canva's stylesheets often pin
 * `html, body { height: 100% }`, which would otherwise clip the document
 * height to the iframe viewport.
 */
const NO_SCROLL_STYLE = `<style ${NO_SCROLL_MARKER}>html, body { overflow: hidden !important; height: auto !important; }</style>`;

/**
 * Query string flag the proxy honours to opt into no-scroll injection.
 * Consumers (e.g. the curtain-canva embed) append `?disableScroll=1` to
 * the proxied URL when they size the iframe to its full content height.
 * Other consumers (e.g. the standard external-link page where the iframe
 * is fixed-size and *needs* internal scroll) omit the flag and get the
 * Canva page rendered untouched.
 */
const DISABLE_SCROLL_QUERY_PARAM = "disableScroll";
const DISABLE_SCROLL_QUERY_VALUE = "1";

/**
 * Returns true when the proxy should inject the no-scroll style block for
 * this request. Checked by the proxy route per request, so two iframes
 * pointing at the same upstream Canva URL can get different treatments.
 */
export function shouldDisableProxiedScroll(url: URL): boolean {
  return (
    url.searchParams.get(DISABLE_SCROLL_QUERY_PARAM) ===
    DISABLE_SCROLL_QUERY_VALUE
  );
}

/**
 * Injects a <style> tag into the given HTML document that disables internal
 * scrolling on the iframe document. Idempotent — calling it multiple times
 * results in a single injected style block.
 *
 * - When a <head> tag is present, the style is inserted right after it.
 * - Otherwise, the style is prepended to the document so it still applies.
 */
export function injectIframeNoScrollStyle(html: string): string {
  if (html.includes(NO_SCROLL_MARKER)) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${NO_SCROLL_STYLE}`);
  }

  return `${NO_SCROLL_STYLE}${html}`;
}

const HIDE_SCROLLBAR_MARKER = "data-canva-proxy-hide-scrollbar";

/**
 * Style block injected into proxied Canva HTML to hide the scrollbar
 * **without** disabling scrolling. This is the counterpart to
 * `NO_SCROLL_STYLE`: there the iframe is sized to full content height so
 * scroll is removed entirely; here (the fixed-size `ExternalLinkPage`
 * iframe) the document keeps its own internal scroll, but the scrollbar
 * chrome would otherwise sit visibly along the iframe's edge.
 *
 * The selector is the **universal** `*`, not `html, body`. Canva published
 * sites pin `body { overflow: hidden; height: 100vh }` and put the real
 * scroll surface in an inner `<div>` with an obfuscated, per-publish hashed
 * class (e.g. `.ZRRuDw`) — so the document viewport never owns the
 * scrollbar and the hashed class can't be targeted by name. Hiding every
 * element's scrollbar is what actually reaches that div, and it's exactly
 * the desired behaviour for an invitation page (no element should show a
 * scrollbar). Verified against the live proxied document: the inner
 * scroller's computed `scrollbar-width` flips `auto → none` while
 * programmatic and wheel scrolling keep working.
 *
 * Covers all three engines: `scrollbar-width: none` (Firefox + Chrome 121+),
 * `-ms-overflow-style: none` (legacy Edge/IE), and
 * `::-webkit-scrollbar { display: none }` (older Chrome/Safari). `!important`
 * beats Canva's defaults; the live test confirmed no competing `!important`
 * rule exists on the scroller.
 */
const HIDE_SCROLLBAR_STYLE = `<style ${HIDE_SCROLLBAR_MARKER}>* { scrollbar-width: none !important; -ms-overflow-style: none !important; } *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }</style>`;

/**
 * Query string flag the proxy honours to opt into scrollbar-hiding.
 * Independent of `disableScroll`: `ExternalLinkPage` appends
 * `?hideScrollbar=1` because its iframe is fixed-size and *keeps* internal
 * scroll — it only wants the scrollbar chrome gone. Consumers that omit
 * the flag get the Canva page rendered untouched.
 */
const HIDE_SCROLLBAR_QUERY_PARAM = "hideScrollbar";
const HIDE_SCROLLBAR_QUERY_VALUE = "1";

/**
 * Returns true when the proxy should inject the scrollbar-hiding style for
 * this request. Like `shouldDisableProxiedScroll`, this is checked per
 * request so two iframes pointing at the same upstream Canva URL can get
 * different treatments.
 */
export function shouldHideProxiedScrollbar(url: URL): boolean {
  return (
    url.searchParams.get(HIDE_SCROLLBAR_QUERY_PARAM) ===
    HIDE_SCROLLBAR_QUERY_VALUE
  );
}

/**
 * Injects a <style> tag into the given HTML document that hides the
 * scrollbar while leaving scrolling functional. Idempotent — calling it
 * multiple times results in a single injected style block.
 *
 * - When a <head> tag is present, the style is inserted right after it.
 * - Otherwise, the style is prepended to the document so it still applies.
 */
export function injectIframeHideScrollbarStyle(html: string): string {
  if (html.includes(HIDE_SCROLLBAR_MARKER)) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${HIDE_SCROLLBAR_STYLE}`);
  }

  return `${HIDE_SCROLLBAR_STYLE}${html}`;
}

/**
 * Returns the upstream Canva host for an externalLink invitation, suitable
 * for emitting `<link rel="preconnect" href="https://<host>">` from the
 * parent document. The browser then opens the TLS connection to the Canva
 * CDN in parallel with the HTML proxy response, overlapping ~100-300 ms of
 * connection setup on first asset load.
 *
 * Returns `null` for inputs that are not http(s) URLs, which mirrors how
 * `getExternalInvitationEmbedSrc` falls back to the raw string.
 */
function getCanvaUpstreamHost(externalLink: string): string | null {
  if (!externalLink) return null;
  try {
    const url = new URL(externalLink);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.host;
  } catch {
    return null;
  }
}
