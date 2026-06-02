import { describe, expect, it } from "vitest";

import { getPhoneFrameAnimation } from "@/lib/landing-phone-animation";

const FULL_ANIMATION = {
  stageClassName: "hero-phone-stage",
  phoneClassName: "hero-phone-orbit",
  showAnimatedGlow: true,
  showStaticShadow: false,
  showSparkles: true,
} as const;

const STATIC_FALLBACK = {
  stageClassName: "",
  phoneClassName: "",
  showAnimatedGlow: false,
  showStaticShadow: true,
  showSparkles: false,
} as const;

const NO_ANIMATION = {
  stageClassName: "",
  phoneClassName: "",
  showAnimatedGlow: false,
  showStaticShadow: false,
  showSparkles: false,
} as const;

describe("getPhoneFrameAnimation", () => {
  it("returns a no-op result when animation is undefined", () => {
    expect(getPhoneFrameAnimation(undefined, false, false)).toEqual(
      NO_ANIMATION,
    );
  });

  it("returns a no-op result when animation is 'none'", () => {
    expect(getPhoneFrameAnimation("none", false, false)).toEqual(NO_ANIMATION);
  });

  it("returns the full orbit when hero-float, motion allowed and not mobile", () => {
    expect(getPhoneFrameAnimation("hero-float", false, false)).toEqual(
      FULL_ANIMATION,
    );
  });

  it("treats null reduceMotion and null isMobile (pre-hydration) as motion allowed", () => {
    expect(getPhoneFrameAnimation("hero-float", null, null)).toEqual(
      FULL_ANIMATION,
    );
  });

  it("treats undefined reduceMotion and undefined isMobile as motion allowed", () => {
    expect(getPhoneFrameAnimation("hero-float", undefined, undefined)).toEqual(
      FULL_ANIMATION,
    );
  });

  it("falls back to static shadow only when reduceMotion is true", () => {
    expect(getPhoneFrameAnimation("hero-float", true, false)).toEqual(
      STATIC_FALLBACK,
    );
  });

  it("falls back to static shadow only when isMobile is true", () => {
    expect(getPhoneFrameAnimation("hero-float", false, true)).toEqual(
      STATIC_FALLBACK,
    );
  });

  it("falls back to static shadow only when both reduceMotion and isMobile are true", () => {
    expect(getPhoneFrameAnimation("hero-float", true, true)).toEqual(
      STATIC_FALLBACK,
    );
  });
});
