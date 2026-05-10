import { describe, expect, it } from "vitest";
import { getExternalInvitationEmbedSrc } from "../lib/external-invitation-form";

describe("getExternalInvitationEmbedSrc", () => {
  it("rewrites https Canva URLs through /canva-proxy/<host><path><query>", () => {
    expect(getExternalInvitationEmbedSrc("https://my-design.canva.site/")).toBe(
      "/canva-proxy/my-design.canva.site",
    );
    expect(
      getExternalInvitationEmbedSrc("https://my-design.canva.site/page-1"),
    ).toBe(
      "/canva-proxy/my-design.canva.site/page-1",
    );
    expect(
      getExternalInvitationEmbedSrc(
        "https://my-design.canva.site/page-1?foo=bar",
      ),
    ).toBe(
      "/canva-proxy/my-design.canva.site/page-1?foo=bar",
    );
  });

  it("preserves the root '/' as no path segment", () => {
    expect(getExternalInvitationEmbedSrc("https://x.canva.site/")).toBe(
      "/canva-proxy/x.canva.site",
    );
  });

  it("returns the original string when input is not http/https", () => {
    expect(getExternalInvitationEmbedSrc("javascript:alert(1)")).toBe(
      "javascript:alert(1)",
    );
    expect(getExternalInvitationEmbedSrc("ftp://example.com/")).toBe(
      "ftp://example.com/",
    );
  });

  it("returns the original string when input is not a valid URL", () => {
    expect(getExternalInvitationEmbedSrc("not a url")).toBe("not a url");
    expect(getExternalInvitationEmbedSrc("")).toBe("");
  });

  it("supports http (not just https) for completeness", () => {
    expect(getExternalInvitationEmbedSrc("http://example.com/path")).toBe(
      "/canva-proxy/example.com/path",
    );
  });
});
