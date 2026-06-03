"use client";

import {
  DEFAULT_HERO_GRADIENT_START_VIDEO,
  DEFAULT_HERO_SCRIM_OPACITY,
} from "@/components/shared/InvitationHero";
import type { HeroOverlayConfig } from "@/lib/types";

interface CurtainHeroVideoProps {
  /** Hero background video URL (invitation.videoUrl). */
  videoUrl: string;
  /** Poster for the hero video (invitation.videoPoster). */
  videoPoster?: string;
  /** Theme background color the bottom gradient fades into. */
  backgroundColor: string;
  /**
   * Admin-tunable overlay (dark scrim + bottom gradient start). Same shape
   * InvitationHero consumes — falls back to the InvitationHero video defaults
   * when fields are missing.
   */
  heroOverlay?: HeroOverlayConfig;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Looping, full-bleed hero video layer rendered *inside* CurtainsHero, behind
 * the curtain video (zIndex 0). It is always mounted and autoplaying, so by the
 * time the curtain video fades out (the curtain "opens") the hero video is
 * already playing underneath and is revealed seamlessly. The hero info
 * (names / quote) is rendered above this by CurtainsHero.
 *
 * `muted` + `playsInline` + `autoPlay` is the canonical mobile autoplay combo.
 */
export default function CurtainHeroVideo({
  videoUrl,
  videoPoster,
  backgroundColor,
  heroOverlay,
}: CurtainHeroVideoProps) {
  const scrimOpacity = clamp(
    heroOverlay?.scrimOpacity ?? DEFAULT_HERO_SCRIM_OPACITY,
    0,
    1,
  );
  const gradientStart = clamp(
    heroOverlay?.gradientStart ?? DEFAULT_HERO_GRADIENT_START_VIDEO,
    0,
    100,
  );

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <video
        src={videoUrl}
        poster={videoPoster}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark scrim so the hero info stays legible over bright video. */}
      {scrimOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${scrimOpacity})` }}
        />
      )}

      {/* Bottom gradient fading into the theme background. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent ${gradientStart}%, ${backgroundColor} 100%)`,
        }}
      />
    </div>
  );
}
