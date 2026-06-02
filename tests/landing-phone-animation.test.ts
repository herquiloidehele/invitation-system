import { describe, expect, it } from "vitest";

import { getPhoneFrameAnimation } from "@/lib/landing-phone-animation";

describe("getPhoneFrameAnimation", () => {
  it("returns a no-op result when animation is undefined", () => {
    expect(getPhoneFrameAnimation(undefined, false)).toEqual({
      wrapperClassName: "",
      showAnimatedGlow: false,
      showStaticShadow: false,
      showGlassSweep: false,
    });
  });

  it("returns a no-op result when animation is 'none'", () => {
    expect(getPhoneFrameAnimation("none", false)).toEqual({
      wrapperClassName: "",
      showAnimatedGlow: false,
      showStaticShadow: false,
      showGlassSweep: false,
    });
  });

  it("returns float + animated glow + glass sweep for hero-float when motion is allowed", () => {
    expect(getPhoneFrameAnimation("hero-float", false)).toEqual({
      wrapperClassName: "hero-phone-float",
      showAnimatedGlow: true,
      showStaticShadow: false,
      showGlassSweep: true,
    });
  });

  it("treats null reduceMotion (pre-hydration) as motion allowed", () => {
    expect(getPhoneFrameAnimation("hero-float", null)).toEqual({
      wrapperClassName: "hero-phone-float",
      showAnimatedGlow: true,
      showStaticShadow: false,
      showGlassSweep: true,
    });
  });

  it("falls back to static shadow only when reduceMotion is true", () => {
    expect(getPhoneFrameAnimation("hero-float", true)).toEqual({
      wrapperClassName: "",
      showAnimatedGlow: false,
      showStaticShadow: true,
      showGlassSweep: false,
    });
  });
});
