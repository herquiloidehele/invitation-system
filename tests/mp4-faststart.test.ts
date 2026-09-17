import { describe, expect, it } from "vitest";

import { isFaststartMp4 } from "@/lib/mp4-faststart";

/** Build a top-level MP4 box header (32-bit size + 4-char type). */
function boxHeader(size: number, type: string): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(size, 0);
  buf.write(type, 4, "ascii");
  return buf;
}

describe("isFaststartMp4", () => {
  it("accepts a real faststart header (ftyp → moov)", () => {
    // First 32 bytes of an actual hero video that the browser fetches in a
    // single request.
    const head = Buffer.from(
      "000000186674797069736f6d00000001" + "69736f6d6176633100" + "0016be" + "6d6f6f76",
      "hex",
    );
    expect(isFaststartMp4(head)).toBe(true);
  });

  it("rejects a real moov-at-end header (ftyp → free → mdat)", () => {
    // First 48 bytes of an actual cover clip that the browser fetches in three
    // requests: aborted head read, tail read for `moov`, then the body again.
    const head = Buffer.from(
      "000000206674797069736f6d00000200" +
        "69736f6d69736f32617663316d703431" +
        "000000086672656500" +
        "19c756" +
        "6d646174",
      "hex",
    );
    expect(isFaststartMp4(head)).toBe(false);
  });

  it("skips past leading boxes to find moov", () => {
    const head = Buffer.concat([
      boxHeader(16, "ftyp"),
      Buffer.alloc(8),
      boxHeader(8, "free"),
      boxHeader(8, "wide"),
      boxHeader(4096, "moov"),
    ]);
    expect(isFaststartMp4(head)).toBe(true);
  });

  it("handles a 64-bit box size before moov", () => {
    const large = Buffer.concat([boxHeader(1, "free"), Buffer.alloc(8)]);
    large.writeUInt32BE(0, 8); // size high word
    large.writeUInt32BE(24, 12); // size low word
    const head = Buffer.concat([
      large,
      Buffer.alloc(8), // remainder of the 24-byte free box
      boxHeader(4096, "moov"),
    ]);
    expect(isFaststartMp4(head)).toBe(true);
  });

  it("treats a box that runs to EOF before moov as non-faststart", () => {
    const head = Buffer.concat([boxHeader(16, "ftyp"), Buffer.alloc(8), boxHeader(0, "mdat")]);
    expect(isFaststartMp4(head)).toBe(false);
  });

  it.each([
    ["empty input", Buffer.alloc(0)],
    ["a truncated header", Buffer.from("0000001866747970", "hex").subarray(0, 6)],
    ["a nonsense box size", Buffer.concat([boxHeader(3, "ftyp"), boxHeader(8, "moov")])],
  ])("reports %s as non-faststart rather than throwing", (_label, head) => {
    expect(isFaststartMp4(head)).toBe(false);
  });

  it("does not loop forever when moov never appears", () => {
    const head = Buffer.concat(
      Array.from({ length: 64 }, () => Buffer.concat([boxHeader(16, "free"), Buffer.alloc(8)])),
    );
    expect(isFaststartMp4(head)).toBe(false);
  });
});

describe("ensureWebSafeMp4", () => {
  it("checks the atom layout before skipping an H.264 MP4", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("lib/video-transcode.ts", "utf8");
    // The old fast path returned unconditionally for any H.264 .mp4, which let
    // moov-at-end files through and made browsers download them in 3 requests.
    expect(source).not.toMatch(/if \(isH264 && isMp4Container\) return false;/);
    expect(source).toContain("isFaststartMp4File");
  });
});
