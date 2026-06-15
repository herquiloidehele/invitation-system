import { describe, expect, it } from "vitest";
import {
  injectIframeHideScrollbarStyle,
  shouldHideProxiedScrollbar,
} from "../lib/canva-proxy-html";

describe("shouldHideProxiedScrollbar", () => {
  it("returns false by default so proxied Canva pages keep their scrollbar", () => {
    const url = new URL("http://localhost:3000/canva-proxy/x.canva.site/page-1");
    expect(shouldHideProxiedScrollbar(url)).toBe(false);
  });

  it("returns true when the request has ?hideScrollbar=1", () => {
    const url = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?hideScrollbar=1",
    );
    expect(shouldHideProxiedScrollbar(url)).toBe(true);
  });

  it("treats only the literal '1' as opt-in to keep behaviour explicit", () => {
    const truthy = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?hideScrollbar=true",
    );
    expect(shouldHideProxiedScrollbar(truthy)).toBe(false);

    const empty = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?hideScrollbar=",
    );
    expect(shouldHideProxiedScrollbar(empty)).toBe(false);
  });

  it("is independent of the disableScroll flag", () => {
    const url = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?disableScroll=1",
    );
    expect(shouldHideProxiedScrollbar(url)).toBe(false);
  });
});

describe("injectIframeHideScrollbarStyle", () => {
  it("inserts the style block immediately after <head>", () => {
    const html = "<html><head><title>x</title></head><body>hi</body></html>";
    const out = injectIframeHideScrollbarStyle(html);
    expect(out).toContain("data-canva-proxy-hide-scrollbar");
    // Style must land inside <head>, before the existing head content.
    expect(out).toMatch(/<head><style data-canva-proxy-hide-scrollbar>/);
  });

  it("hides the scrollbar across all three engines while keeping scroll", () => {
    const out = injectIframeHideScrollbarStyle("<head></head>");
    // Firefox, legacy Edge/IE, and WebKit/Blink respectively.
    expect(out).toContain("scrollbar-width: none");
    expect(out).toContain("-ms-overflow-style: none");
    expect(out).toContain("::-webkit-scrollbar");
    // It must NOT touch overflow — scrolling stays functional (that is the
    // whole difference from the disableScroll path).
    expect(out).not.toContain("overflow: hidden");
  });

  it("targets every element, not just html/body", () => {
    // Regression guard: Canva puts the real scroll surface in an inner
    // <div> with an obfuscated hashed class, so an `html, body`-scoped rule
    // misses it entirely. The rule must be universal.
    const out = injectIframeHideScrollbarStyle("<head></head>");
    expect(out).toContain("* { scrollbar-width: none");
    expect(out).toContain("*::-webkit-scrollbar");
    expect(out).not.toContain("html, body { scrollbar-width");
  });

  it("prepends the style when there is no <head>", () => {
    const out = injectIframeHideScrollbarStyle("<body>hi</body>");
    expect(out.startsWith("<style data-canva-proxy-hide-scrollbar>")).toBe(true);
  });

  it("is idempotent — a second call does not double-inject", () => {
    const once = injectIframeHideScrollbarStyle("<head></head>");
    const twice = injectIframeHideScrollbarStyle(once);
    expect(twice).toBe(once);
    expect(twice.match(/data-canva-proxy-hide-scrollbar/g)).toHaveLength(1);
  });
});
