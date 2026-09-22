import { describe, expect, it } from "vitest";

import {
  resolveImageCompression,
  PAGE_BACKGROUND_PROFILE,
} from "@/lib/upload-compression";

describe("resolveImageCompression", () => {
  it("transcodes a page-background upload to a small WebP regardless of source format", () => {
    // The reported bug: a 721 KB PNG background painted in bands as it streamed.
    // Backgrounds must come out as a compact WebP so they arrive in one shot.
    const opts = resolveImageCompression({
      fileType: "image/png",
      maxSizeMB: 2,
      uploadProfile: PAGE_BACKGROUND_PROFILE,
    });
    expect(opts).not.toBeNull();
    expect(opts!.fileType).toBe("image/webp");
    expect(opts!.maxSizeMB).toBeLessThanOrEqual(0.5);
    expect(opts!.useWebWorker).toBe(true);
  });

  it("keeps the source format and a 2MB ceiling for ordinary photo uploads", () => {
    const opts = resolveImageCompression({
      fileType: "image/jpeg",
      maxSizeMB: 5,
      uploadProfile: undefined,
    });
    expect(opts).not.toBeNull();
    expect(opts!.fileType).toBe("image/jpeg");
    expect(opts!.maxSizeMB).toBe(2);
    expect(opts!.maxWidthOrHeight).toBe(2560);
  });

  it("never lets the photo ceiling exceed 2MB but honours a tighter caller budget", () => {
    expect(
      resolveImageCompression({ fileType: "image/png", maxSizeMB: 1 })!
        .maxSizeMB,
    ).toBe(1);
    expect(
      resolveImageCompression({ fileType: "image/png", maxSizeMB: 5 })!
        .maxSizeMB,
    ).toBe(2);
  });

  it("skips SVG (vector) and GIF (often animated) so canvas never rasterises them", () => {
    expect(
      resolveImageCompression({ fileType: "image/svg+xml", maxSizeMB: 2 }),
    ).toBeNull();
    expect(
      resolveImageCompression({ fileType: "image/gif", maxSizeMB: 2 }),
    ).toBeNull();
  });

  it("still skips SVG/GIF even when a background profile asks for compression", () => {
    expect(
      resolveImageCompression({
        fileType: "image/svg+xml",
        maxSizeMB: 2,
        uploadProfile: PAGE_BACKGROUND_PROFILE,
      }),
    ).toBeNull();
  });
});
