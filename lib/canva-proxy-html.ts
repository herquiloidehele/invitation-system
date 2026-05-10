/**
 * Helpers for transforming the HTML returned by the Canva reverse proxy.
 *
 * Kept in `lib/` so it can be unit-tested without spinning up the route
 * runtime, and reused by `app/canva-proxy/[...path]/route.ts`.
 */

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
