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
