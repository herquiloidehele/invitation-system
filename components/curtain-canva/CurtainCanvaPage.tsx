"use client";

import { useCallback, useRef, useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import CurtainsHero from "./CurtainsHero";
import ImageCanvas from "@/components/shared/ImageCanvas";
import RevealableExternalSections from "@/components/shared/RevealableExternalSections";
import { useRevealScrollLock } from "@/hooks/useRevealScrollLock";
import { shouldFireHeroConfetti } from "@/lib/curtain-canva";

interface CurtainCanvaPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** True when shown inside the public landing-page phone preview iframe.
   *  Forces the sample personal guest card to render for display purposes. */
  isLandingPreview?: boolean;
}

export default function CurtainCanvaPage({
  invitation,
  theme,
  isLandingPreview = false,
}: CurtainCanvaPageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Curtain-reveal gating: the page is locked to the hero viewport until the
  // curtain video finishes (or a reduced-motion/error skip).
  const [revealed, setRevealed] = useState(false);
  const handleRevealed = useCallback(() => setRevealed(true), []);
  useRevealScrollLock(revealed);

  return (
    <main
      className="min-h-dvh overflow-x-hidden"
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        overflowAnchor: "none",
      }}
    >
      <ImageCanvas
        layer={invitation.imageLayer}
        frontLayerPosition="interleaved"
      >
        <CurtainsHero
          couple={invitation.couple}
          quote={invitation.quote}
          inviteMessage={invitation.parents?.inviteMessage}
          theme={theme}
          audioRef={audioRef}
          curtainVideoUrl={invitation.curtainVideoUrl}
          curtainVideoPoster={invitation.curtainVideoPoster}
          heroVideoUrl={invitation.videoUrl}
          heroVideoPoster={invitation.videoPoster}
          heroMediaFit={invitation.heroMediaFit}
          heroOverlay={invitation.heroOverlay}
          heroScrollIndicator={invitation.heroScrollIndicator}
          customTexts={invitation.customTexts}
          textStyles={invitation.textStyles}
          confettiEnabled={shouldFireHeroConfetti(invitation.heroConfetti)}
          onRevealed={handleRevealed}
          eventType={invitation.eventType}
          heroTextLayer={invitation.heroTextLayer}
        />

        <RevealableExternalSections
          invitation={invitation}
          theme={theme}
          revealed={revealed}
          audioRef={audioRef}
          isLandingPreview={isLandingPreview}
        />
      </ImageCanvas>
    </main>
  );
}
