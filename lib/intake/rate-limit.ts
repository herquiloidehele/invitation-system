// In-memory sliding-window limiter for the public intake routes.
//
// Production runs a single Railway replica, so process memory is a correct
// place for these counters. Idle keys are evicted once the map grows past
// `maxKeys` so a flood of distinct keys cannot grow memory without bound.

export interface RateLimiter {
  /** Records a hit and returns false when the key is over its limit. */
  check(key: string, now?: number): boolean;
  size(): number;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 5000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      const last = times[times.length - 1];
      if (last === undefined || now - last >= windowMs) hits.delete(key);
    }
    // Still too many active keys: drop the oldest insertions.
    while (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }

  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.delete(key);
      hits.set(key, recent);
      if (hits.size > maxKeys) prune(now);
      return true;
    },
    size() {
      return hits.size;
    },
  };
}
