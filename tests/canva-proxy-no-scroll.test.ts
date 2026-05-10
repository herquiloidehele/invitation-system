import { describe, expect, it } from "vitest";
import { shouldDisableProxiedScroll } from "../lib/canva-proxy-html";

describe("shouldDisableProxiedScroll", () => {
  it("returns false by default so external-link Canva pages keep their scroll", () => {
    const url = new URL("http://localhost:3000/canva-proxy/x.canva.site/page-1");
    expect(shouldDisableProxiedScroll(url)).toBe(false);
  });

  it("returns true when the request has ?disableScroll=1", () => {
    const url = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?disableScroll=1",
    );
    expect(shouldDisableProxiedScroll(url)).toBe(true);
  });

  it("treats only the literal '1' as opt-in to keep behaviour explicit", () => {
    const truthy = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?disableScroll=true",
    );
    expect(shouldDisableProxiedScroll(truthy)).toBe(false);

    const empty = new URL(
      "http://localhost:3000/canva-proxy/x.canva.site/?disableScroll=",
    );
    expect(shouldDisableProxiedScroll(empty)).toBe(false);
  });
});
