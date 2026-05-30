import { describe, expect, it } from "vitest";
import { buildStableUpstreamHeaders } from "@/lib/canva-proxy-headers";

describe("buildStableUpstreamHeaders", () => {
  it("sets a fixed user-agent", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("user-agent")).toBe("canva-proxy/1.0");
  });

  it("sets a fixed accept-language", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("accept-language")).toBe("pt-BR,pt;q=0.9,en;q=0.8");
  });

  it("sets accept */*", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("accept")).toBe("*/*");
  });

  it("rewrites host and referer to the upstream host", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("host")).toBe("foo.canva.site");
    expect(h.get("referer")).toBe("https://foo.canva.site/");
  });

  it("does not include cache-defeating client headers", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("if-modified-since")).toBeNull();
    expect(h.get("if-none-match")).toBeNull();
    expect(h.get("range")).toBeNull();
  });

  it("does not include propagated cookies", () => {
    const h = buildStableUpstreamHeaders("foo.canva.site");
    expect(h.get("cookie")).toBeNull();
  });
});
