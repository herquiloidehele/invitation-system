export type PhonePreviewAnimation = "hero-float" | "none";

export interface PhoneFrameAnimation {
  /** Class on the outer perspective stage wrapper. Empty when no animation. */
  stageClassName: string;
  /** Class on the phone frame element (drives the 3D orbit). Empty when no animation. */
  phoneClassName: string;
  /** Render the animated radial glow behind the phone. */
  showAnimatedGlow: boolean;
  /** Render the static enhanced shadow (mobile + reduced-motion fallback). */
  showStaticShadow: boolean;
  /** Render the three orbiting sparkles. */
  showSparkles: boolean;
}

const NO_ANIMATION: PhoneFrameAnimation = {
  stageClassName: "",
  phoneClassName: "",
  showAnimatedGlow: false,
  showStaticShadow: false,
  showSparkles: false,
};

const STATIC_FALLBACK: PhoneFrameAnimation = {
  stageClassName: "",
  phoneClassName: "",
  showAnimatedGlow: false,
  showStaticShadow: true,
  showSparkles: false,
};

const FULL_ANIMATION: PhoneFrameAnimation = {
  stageClassName: "hero-phone-stage",
  phoneClassName: "hero-phone-orbit",
  showAnimatedGlow: true,
  showStaticShadow: false,
  showSparkles: true,
};

export function getPhoneFrameAnimation(
  animation: PhonePreviewAnimation | undefined,
  reduceMotion: boolean | null | undefined,
  isMobile: boolean | null | undefined,
): PhoneFrameAnimation {
  if (animation !== "hero-float") {
    return NO_ANIMATION;
  }

  if (reduceMotion === true || isMobile === true) {
    return STATIC_FALLBACK;
  }

  return FULL_ANIMATION;
}
