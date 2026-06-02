export type PhonePreviewAnimation = "hero-float" | "none";

export interface PhoneFrameAnimation {
  /** Class to apply to the outer wrapper around the phone frame. Empty when no animation should run. */
  wrapperClassName: string;
  /** Render the animated radial glow behind the frame. */
  showAnimatedGlow: boolean;
  /** Render the static shadow behind the frame (reduced-motion fallback). */
  showStaticShadow: boolean;
  /** Render the moving glass-highlight overlay above the iframe. */
  showGlassSweep: boolean;
}

const NO_ANIMATION: PhoneFrameAnimation = {
  wrapperClassName: "",
  showAnimatedGlow: false,
  showStaticShadow: false,
  showGlassSweep: false,
};

export function getPhoneFrameAnimation(
  animation: PhonePreviewAnimation | undefined,
  reduceMotion: boolean | null | undefined,
): PhoneFrameAnimation {
  if (animation !== "hero-float") {
    return NO_ANIMATION;
  }

  if (reduceMotion === true) {
    return {
      wrapperClassName: "",
      showAnimatedGlow: false,
      showStaticShadow: true,
      showGlassSweep: false,
    };
  }

  return {
    wrapperClassName: "hero-phone-float",
    showAnimatedGlow: true,
    showStaticShadow: false,
    showGlassSweep: true,
  };
}
