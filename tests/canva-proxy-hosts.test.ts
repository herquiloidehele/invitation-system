import { describe, expect, it } from "vitest";
import { isHostAllowed } from "@/lib/canva-proxy-hosts";

describe("isHostAllowed", () => {
  it("allows canva.site subdomains", () => {
    expect(isHostAllowed("my-design.canva.site")).toBe(true);
    expect(isHostAllowed("foo.canva.site")).toBe(true);
  });

  it("allows my.canva.site subdomains", () => {
    expect(isHostAllowed("design1.my.canva.site")).toBe(true);
  });

  it("allows the brindealstudio.com vanity host", () => {
    expect(isHostAllowed("brindealstudio.com")).toBe(true);
  });

  it("rejects unrelated hosts", () => {
    expect(isHostAllowed("evil.com")).toBe(false);
  });

  it("rejects hosts that merely contain canva.site as a substring", () => {
    expect(isHostAllowed("example.canva.site.evil.com")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isHostAllowed("FOO.CANVA.SITE")).toBe(true);
  });
});
