import { describe, expect, it } from "vitest";

import { mediaImageProps } from "@/lib/ai-media";

describe("mediaImageProps", () => {
  it("uses fill mode when fill is set", () => {
    const r = mediaImageProps({ src: "/a.jpg", fill: true });
    expect(r.fill).toBe(true);
    expect("width" in r).toBe(false);
    expect("height" in r).toBe(false);
  });

  it("uses explicit width/height when provided and not fill", () => {
    const r = mediaImageProps({ src: "/a.jpg", width: 320, height: 200 });
    expect(r.fill).toBeUndefined();
    expect(r.width).toBe(320);
    expect(r.height).toBe(200);
  });

  it("defaults objectFit to cover in the style", () => {
    const r = mediaImageProps({ src: "/a.jpg", fill: true });
    expect(r.style.objectFit).toBe("cover");
  });

  it("honors an explicit objectFit", () => {
    const r = mediaImageProps({ src: "/a.jpg", fill: true, objectFit: "contain" });
    expect(r.style.objectFit).toBe("contain");
  });

  it("maps rounded:true to a large radius and rounded:number to px", () => {
    expect(mediaImageProps({ src: "/a.jpg", fill: true, rounded: true }).style.borderRadius).toBe(9999);
    expect(mediaImageProps({ src: "/a.jpg", fill: true, rounded: 12 }).style.borderRadius).toBe(12);
  });

  it("merges caller style over defaults", () => {
    const r = mediaImageProps({ src: "/a.jpg", fill: true, style: { opacity: 0.5 } });
    expect(r.style.opacity).toBe(0.5);
    expect(r.style.objectFit).toBe("cover");
  });

  it("passes alt through, defaulting to empty string", () => {
    expect(mediaImageProps({ src: "/a.jpg", fill: true }).alt).toBe("");
    expect(mediaImageProps({ src: "/a.jpg", fill: true, alt: "hero" }).alt).toBe("hero");
  });
});
