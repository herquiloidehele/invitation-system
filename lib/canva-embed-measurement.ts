/**
 * Helpers used by the curtain-canva CanvaEmbed component to size its host
 * iframe to the proxied Canva document's real content height.
 *
 * The iframe lives inside a fixed-size off-screen wrapper during preload
 * (so the page can fetch and lay out before the user reveals it). That
 * wrapper forces the iframe element to a large height (e.g. 12000px), and
 * the iframe's `documentElement` reports *its own viewport*, which equals
 * the wrapper size — not the Canva content size. So measurements that
 * consult `documentElement.scrollHeight` would round-trip the wrapper's
 * size back into the section, leaving thousands of pixels of empty space
 * below the actual Canva content.
 *
 * Reading from `<body>` instead is the honest signal: it sizes to the
 * inner content regardless of how tall its containing iframe is.
 */

export interface IframeBodyMetrics {
  bodyScrollHeight: number;
  bodyOffsetHeight: number;
}

/**
 * Returns the body's content height in pixels, or `null` when the body
 * hasn't been measured yet (both inputs are zero or invalid). Takes the
 * larger of `scrollHeight` and `offsetHeight` to be robust against
 * floating-point children that shrink one metric in some browsers.
 */
export function measureIframeBodyHeight(
  metrics: IframeBodyMetrics,
): number | null {
  const candidates = [metrics.bodyScrollHeight, metrics.bodyOffsetHeight]
    .filter((n) => Number.isFinite(n) && n > 0);

  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

export function shouldResetIframeHeightForNavigation({
  currentHeight,
  isInternalCanvaNavigation,
}: {
  currentHeight: number | null;
  isInternalCanvaNavigation: boolean;
}): boolean {
  return !isInternalCanvaNavigation || currentHeight === null;
}

export function shouldRestoreParentScrollForNavigation({
  beforeScrollY,
  currentScrollY,
  isInternalCanvaNavigation,
}: {
  beforeScrollY: number;
  currentScrollY: number;
  isInternalCanvaNavigation: boolean;
}): boolean {
  return isInternalCanvaNavigation && currentScrollY !== beforeScrollY;
}
