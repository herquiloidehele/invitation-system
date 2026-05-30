import { describe, expect, it } from "vitest";
import {
  canvaProxyRevalidateBodySchema,
  isHostAllowed,
} from "@/lib/canva-proxy-hosts";

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

describe("canvaProxyRevalidateBodySchema", () => {
  it("accepts an empty object (revalidate all)", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.host).toBeUndefined();
    }
  });

  it("accepts an allowed host", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({
      host: "brindealstudio.com",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.host).toBe("brindealstudio.com");
    }
  });

  it("accepts an allowed canva.site subdomain", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({
      host: "my-design.canva.site",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a disallowed host", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({ host: "evil.com" });
    expect(r.success).toBe(false);
  });

  it("rejects a non-string host", () => {
    const r = canvaProxyRevalidateBodySchema.safeParse({ host: 123 });
    expect(r.success).toBe(false);
  });
});
