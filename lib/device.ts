// Lightweight server-side User-Agent classification. Used to decide whether to
// ship heavy interactive widgets (e.g. live invitation-preview iframes on the
// landing page) or a lightweight static fallback.
//
// Why this matters: in-app browsers (Instagram/Facebook etc.) run a memory-
// constrained WebView. On lower-RAM phones, a page that boots several full
// invitation apps inside iframes can exceed the WebView content-process memory
// budget and get killed by the OS — which renders as a permanent BLANK WHITE
// page. Serving a static poster + "open" link in those contexts avoids it.

const MOBILE_RE = /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i;

// In-app browser signatures (Meta family + other common social apps).
const IN_APP_RE =
  /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|Twitter|Pinterest|Snapchat|TikTok|Musical_ly|GSA\//i;

export function isMobileUserAgent(ua: string | null | undefined): boolean {
  return !!ua && MOBILE_RE.test(ua);
}

export function isInAppBrowser(ua: string | null | undefined): boolean {
  return !!ua && IN_APP_RE.test(ua);
}

/**
 * True when we should avoid live, memory-heavy embeds (live invitation iframes)
 * and serve a static fallback instead: any phone, or any in-app browser.
 */
export function prefersLightweightEmbeds(
  ua: string | null | undefined,
): boolean {
  return isMobileUserAgent(ua) || isInAppBrowser(ua);
}
