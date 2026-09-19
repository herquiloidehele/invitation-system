/**
 * The opening auto-scroll: pure frame maths, shared by every layout that
 * offers to carry the reader down the page.
 *
 * Kept free of React and of any one template so the behaviour stays identical
 * wherever it is used — see `components/shared/useAutoScroll.ts` for the hook
 * that drives these.
 */

export interface AutoScrollState {
  /** Timestamp of the previous frame, ms. */
  lastMs: number;
  /** Position we last set ourselves, px. */
  lastY: number;
}

export interface AutoScrollFrame {
  nextY: number;
  done: boolean;
}

/**
 * One frame of the opening auto-scroll.
 *
 * Time-based rather than per-frame increments, so the crawl runs at the same
 * speed on a 120Hz phone and a throttled background tab. A long gap (tab was
 * hidden) is capped rather than applied, otherwise returning to the tab would
 * teleport the reader down the page.
 */
export function autoScrollFrame(
  nowMs: number,
  state: AutoScrollState,
  speedPxPerSec: number,
  maxScrollY: number,
): AutoScrollFrame {
  const elapsed = Math.max(0, Math.min(nowMs - state.lastMs, 100));
  const nextY = Math.min(state.lastY + (elapsed / 1000) * speedPxPerSec, maxScrollY);
  return { nextY, done: nextY >= maxScrollY - 1 };
}

/**
 * True when a scroll position differs enough from what we last set to be the
 * reader rather than us.
 *
 * Browsers round and rubber-band scroll positions, so an exact comparison
 * would read our own writes as user input and cancel the crawl immediately.
 */
export function isUserScroll(
  observedY: number,
  ourLastY: number,
  tolerance = 4,
): boolean {
  return Math.abs(observedY - ourLastY) > tolerance;
}
