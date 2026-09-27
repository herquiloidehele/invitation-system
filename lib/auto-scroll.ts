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
 * How many of our own recent writes a reported scroll position may still be
 * echoing.
 *
 * Mobile browsers own the scroll position off the main thread and report it
 * back late. On an iPhone, `scrollY` at the start of a frame reads the position
 * we wrote two frames earlier, truncated to a whole pixel — about 3px behind at
 * 120px/s, and more after any slow frame. Comparing against our latest write
 * alone mistakes that echo for the reader and stops the crawl a few seconds in.
 */
export const ECHO_FRAMES = 4;

/** Append a write to the trail of recent ones, keeping the last `ECHO_FRAMES`. */
export function recordWrite(trail: readonly number[], y: number): number[] {
  return [...trail, y].slice(-ECHO_FRAMES);
}

/**
 * True when a scroll position can't be explained by any of our recent writes,
 * so it must be the reader (or an anchor jump, scroll restoration, a screen
 * reader) rather than us.
 *
 * Browsers also round and rubber-band scroll positions, hence the tolerance
 * either side of the trail.
 */
export function isUserScroll(
  observedY: number,
  ourRecentY: readonly number[],
  tolerance = 4,
): boolean {
  return (
    observedY < Math.min(...ourRecentY) - tolerance ||
    observedY > Math.max(...ourRecentY) + tolerance
  );
}
