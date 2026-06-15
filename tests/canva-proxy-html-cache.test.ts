import { describe, expect, it } from "vitest";
import {
  HtmlResponseCache,
  makeHtmlCacheKey,
  type CachedHtmlResponse,
} from "../lib/canva-proxy-html-cache";

/* ------------------------------------------------------------------ */
/*  HtmlResponseCache                                                    */
/*                                                                      */
/*  In-process LRU+TTL store of compressed Canva HTML shells. It backs  */
/*  the proxy's hottest path, is keyed by an attacker-influenceable     */
/*  URL, and therefore must stay bounded in both entry count and time.  */
/* ------------------------------------------------------------------ */

function entry(tag: string): CachedHtmlResponse {
  return {
    body: Buffer.from(`body-${tag}`),
    encoding: "br",
    contentType: "text/html; charset=utf-8",
  };
}

describe("makeHtmlCacheKey", () => {
  it("distinguishes encoding and scroll flag for the same URL", () => {
    const url = "https://x.canva.site/a";
    const keys = new Set([
      makeHtmlCacheKey(url, "br", false),
      makeHtmlCacheKey(url, "br", true),
      makeHtmlCacheKey(url, "gzip", false),
      makeHtmlCacheKey(url, "gzip", true),
    ]);
    expect(keys.size).toBe(4);
  });

  it("distinguishes the hide-scrollbar flag, defaulting it to false", () => {
    const url = "https://x.canva.site/a";
    // Omitting the flag must match an explicit `false` so pre-existing
    // callers keep hitting the same cache entry.
    expect(makeHtmlCacheKey(url, "br", false)).toBe(
      makeHtmlCacheKey(url, "br", false, false),
    );
    // Toggling it must produce a distinct key so hidden/visible-scrollbar
    // shells never alias each other.
    expect(makeHtmlCacheKey(url, "br", false, true)).not.toBe(
      makeHtmlCacheKey(url, "br", false, false),
    );
    // All four (disableScroll × hideScrollbar) combinations are distinct.
    const keys = new Set([
      makeHtmlCacheKey(url, "br", false, false),
      makeHtmlCacheKey(url, "br", false, true),
      makeHtmlCacheKey(url, "br", true, false),
      makeHtmlCacheKey(url, "br", true, true),
    ]);
    expect(keys.size).toBe(4);
  });

  it("includes the query string so distinct URLs don't collide", () => {
    expect(makeHtmlCacheKey("https://x/a?p=1", "br", false)).not.toBe(
      makeHtmlCacheKey("https://x/a?p=2", "br", false),
    );
  });
});

describe("HtmlResponseCache", () => {
  it("returns a stored entry within its TTL", () => {
    const cache = new HtmlResponseCache(10, 1000, () => 0);
    cache.set("k", entry("1"));
    expect(cache.get("k")).toEqual(entry("1"));
  });

  it("returns null for a missing key", () => {
    const cache = new HtmlResponseCache(10, 1000, () => 0);
    expect(cache.get("missing")).toBeNull();
  });

  it("expires entries once the TTL elapses", () => {
    let now = 0;
    const cache = new HtmlResponseCache(10, 1000, () => now);
    cache.set("k", entry("1"));
    now = 999;
    expect(cache.get("k")).not.toBeNull();
    now = 1000;
    expect(cache.get("k")).toBeNull();
    // The expired entry is dropped, not just hidden.
    expect(cache.size).toBe(0);
  });

  it("evicts the least-recently-used entry past the cap", () => {
    const cache = new HtmlResponseCache(2, 10_000, () => 0);
    cache.set("a", entry("a"));
    cache.set("b", entry("b"));
    // Touch "a" so "b" becomes least-recently-used.
    expect(cache.get("a")).not.toBeNull();
    cache.set("c", entry("c"));

    expect(cache.size).toBe(2);
    expect(cache.get("b")).toBeNull(); // evicted
    expect(cache.get("a")).not.toBeNull();
    expect(cache.get("c")).not.toBeNull();
  });

  it("never grows beyond the cap under key flooding", () => {
    const cache = new HtmlResponseCache(50, 10_000, () => 0);
    for (let i = 0; i < 5000; i++) {
      cache.set(`key-${i}`, entry(String(i)));
    }
    expect(cache.size).toBe(50);
  });

  it("refreshes recency and TTL when an existing key is re-set", () => {
    let now = 0;
    const cache = new HtmlResponseCache(10, 1000, () => now);
    cache.set("k", entry("old"));
    now = 600;
    cache.set("k", entry("new"));
    now = 1599; // < 600 + 1000
    expect(cache.get("k")).toEqual(entry("new"));
    expect(cache.size).toBe(1);
  });
});
