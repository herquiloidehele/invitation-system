import { describe, expect, it } from "vitest";
import {
  compressBuffer,
  pickCompressionEncoding,
} from "../lib/canva-proxy-compression";

/* ------------------------------------------------------------------ */
/*  pickCompressionEncoding — content negotiation                       */
/* ------------------------------------------------------------------ */

describe("pickCompressionEncoding", () => {
  it("prefers br when the client lists both br and gzip", () => {
    expect(pickCompressionEncoding("br, gzip")).toBe("br");
    expect(pickCompressionEncoding("gzip, br")).toBe("br");
    expect(pickCompressionEncoding("gzip, deflate, br")).toBe("br");
  });

  it("falls back to gzip when br is not advertised", () => {
    expect(pickCompressionEncoding("gzip")).toBe("gzip");
    expect(pickCompressionEncoding("gzip, deflate")).toBe("gzip");
  });

  it("returns null when no supported encoding is advertised", () => {
    expect(pickCompressionEncoding("identity")).toBeNull();
    expect(pickCompressionEncoding("deflate")).toBeNull();
    expect(pickCompressionEncoding("")).toBeNull();
    expect(pickCompressionEncoding(null)).toBeNull();
    expect(pickCompressionEncoding(undefined)).toBeNull();
  });

  it("honours q=0 to disqualify an encoding", () => {
    // Client explicitly rejects br via q=0 — must fall back to gzip.
    expect(pickCompressionEncoding("br;q=0, gzip")).toBe("gzip");
    expect(pickCompressionEncoding("br;q=0, gzip;q=0")).toBeNull();
    // q-values are case-insensitive and tolerate whitespace.
    expect(pickCompressionEncoding("BR; Q=0, gzip")).toBe("gzip");
  });

  it("treats wildcards as accepting any supported encoding", () => {
    // `*` means "anything else" — pick the best we support, which is br.
    expect(pickCompressionEncoding("*")).toBe("br");
    // `*;q=0` after explicit gzip means: no other encodings allowed.
    expect(pickCompressionEncoding("gzip, *;q=0")).toBe("gzip");
  });

  it("is case-insensitive for encoding names", () => {
    expect(pickCompressionEncoding("BR")).toBe("br");
    expect(pickCompressionEncoding("Gzip")).toBe("gzip");
    expect(pickCompressionEncoding("GZIP, BR")).toBe("br");
  });
});

/* ------------------------------------------------------------------ */
/*  compressBuffer — payload compression                                */
/* ------------------------------------------------------------------ */

describe("compressBuffer", () => {
  // Canva HTML is mostly inline-serialized state and is extremely
  // compressible — a representative 64KB string of repeating tokens
  // compresses ~50x with brotli at q=4. Compression below 80% would
  // be a regression.
  const repetitiveHtml =
    "<html><head><script>" + "data:".repeat(16384) + "</script></head></html>";

  it("compresses a buffer with brotli at quality 4", async () => {
    const out = await compressBuffer(repetitiveHtml, "br");
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThan(repetitiveHtml.length / 5);
  });

  it("compresses a buffer with gzip at level 6", async () => {
    const out = await compressBuffer(repetitiveHtml, "gzip");
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThan(repetitiveHtml.length / 5);
    // Gzip magic header: 1f 8b
    expect(out[0]).toBe(0x1f);
    expect(out[1]).toBe(0x8b);
  });

  it("accepts a Buffer as input as well as a string", async () => {
    const input = Buffer.from(repetitiveHtml, "utf8");
    const out = await compressBuffer(input, "br");
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBeLessThan(input.length);
  });

  it("rejects unknown encodings", async () => {
    // @ts-expect-error -- intentionally passing an invalid encoding
    await expect(compressBuffer("hello", "deflate")).rejects.toThrow();
  });
});
