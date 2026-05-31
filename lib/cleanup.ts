/**
 * Tracks a set of `setTimeout` / `setInterval` IDs so they can all be
 * cleared together on React component unmount.
 *
 * Usage:
 *   const timers = useRef(createTimerTracker());
 *   useEffect(() => {
 *     timers.current.track(window.setTimeout(...));
 *     return () => timers.current.clearAll();
 *   }, []);
 */
export interface TimerTracker {
  /** Register a timer id. Returns the id unchanged for chaining. */
  track: (id: number) => number;
  /** Clear every registered timer and drop the internal list. */
  clearAll: () => void;
}

export function createTimerTracker(): TimerTracker {
  let ids: number[] = [];
  return {
    track(id: number) {
      ids.push(id);
      return id;
    },
    clearAll() {
      for (const id of ids) {
        clearTimeout(id);
      }
      ids = [];
    },
  };
}
