import { describe, expect, it } from "vitest";

import {
  resolveGalleryImages,
  shouldRenderCoupleGallery,
  resolveGalleryAutoplay,
} from "@/lib/couple-gallery";
import { getImageStyleFor } from "@/lib/image-settings";
import type { CoupleGallery } from "@/lib/types";

const base = (over: Partial<CoupleGallery>): CoupleGallery => ({
  enabled: true,
  style: "kenburns",
  images: [],
  ...over,
});

describe("resolveGalleryImages", () => {
  it("returns [] for undefined / empty", () => {
    expect(resolveGalleryImages(undefined)).toEqual([]);
    expect(resolveGalleryImages(base({ images: [] }))).toEqual([]);
  });

  it("drops images without a src", () => {
    const out = resolveGalleryImages(
      base({ images: [{ src: "" }, { src: "a.jpg" }] }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].src).toBe("a.jpg");
  });

  it("applies focal/zoom defaults", () => {
    const [img] = resolveGalleryImages(base({ images: [{ src: "a.jpg" }] }));
    expect(img).toMatchObject({ positionX: 50, positionY: 50, zoom: 1 });
  });

  it("clamps out-of-range focal/zoom", () => {
    const [img] = resolveGalleryImages(
      base({
        images: [{ src: "a.jpg", positionX: 250, positionY: -10, zoom: 9 }],
      }),
    );
    expect(img).toMatchObject({ positionX: 100, positionY: 0, zoom: 2.5 });
  });

  it("treats blank captions as undefined", () => {
    const [img] = resolveGalleryImages(
      base({ images: [{ src: "a.jpg", caption: "   " }] }),
    );
    expect(img.caption).toBeUndefined();
  });
});

describe("shouldRenderCoupleGallery", () => {
  it("false when missing or disabled", () => {
    expect(shouldRenderCoupleGallery({ coupleGallery: undefined })).toBe(false);
    expect(
      shouldRenderCoupleGallery({
        coupleGallery: base({ enabled: false, images: [{ src: "a.jpg" }] }),
      }),
    ).toBe(false);
  });

  it("false when enabled but no usable images", () => {
    expect(shouldRenderCoupleGallery({ coupleGallery: base({ images: [] }) })).toBe(
      false,
    );
    expect(
      shouldRenderCoupleGallery({ coupleGallery: base({ images: [{ src: "" }] }) }),
    ).toBe(false);
  });

  it("true when enabled with at least one usable image", () => {
    expect(
      shouldRenderCoupleGallery({
        coupleGallery: base({ images: [{ src: "a.jpg" }] }),
      }),
    ).toBe(true);
  });
});

describe("resolveGalleryAutoplay", () => {
  it("defaults on for kenburns, off otherwise", () => {
    expect(resolveGalleryAutoplay(base({ style: "kenburns" }))).toBe(true);
    expect(resolveGalleryAutoplay(base({ style: "grid" }))).toBe(false);
  });
  it("respects an explicit flag", () => {
    expect(
      resolveGalleryAutoplay(base({ style: "kenburns", autoplay: false })),
    ).toBe(false);
    expect(resolveGalleryAutoplay(base({ style: "grid", autoplay: true }))).toBe(
      true,
    );
  });
});

describe("getImageStyleFor", () => {
  it("returns {} for the neutral default", () => {
    expect(getImageStyleFor({ positionX: 50, positionY: 50, zoom: 1 })).toEqual(
      {},
    );
  });
  it("emits object-position + scale when customized", () => {
    expect(getImageStyleFor({ positionX: 20, positionY: 80, zoom: 1.5 })).toEqual({
      objectPosition: "20% 80%",
      transform: "scale(1.5)",
      transformOrigin: "20% 80%",
    });
  });
});
