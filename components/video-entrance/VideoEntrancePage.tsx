"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import VideoEntranceHero from "./VideoEntranceHero";
import RevealableExternalSections from "@/components/shared/RevealableExternalSections";
import { useRevealScrollLock } from "@/hooks/useRevealScrollLock";
import { shouldFireVideoEntranceConfetti } from "@/lib/video-entrance";

interface VideoEntrancePageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function VideoEntrancePage({
  invitation,
  theme,
}: VideoEntrancePageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { trackEvent } = useAnalytics(invitation.slug);

  // The page is locked to the hero viewport until the text reveals.
  const [revealed, setRevealed] = useState(false);
  const handleRevealed = useCallback(() => setRevealed(true), []);
  useRevealScrollLock(revealed);

  useEffect(() => {
    trackEvent("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTapped = () => {
    trackEvent("envelope_open"); // semantic name retained from existing taxonomy
  };

  return (
    <main
      className="min-h-dvh overflow-x-hidden"
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        overflowAnchor: "none",
      }}
    >
      <VideoEntranceHero
        couple={invitation.couple}
        topText={invitation.heroTopText}
        quote={invitation.quote}
        theme={theme}
        audioRef={audioRef}
        videoUrl={invitation.videoUrl}
        videoPoster={invitation.videoPoster}
        heroOverlay={invitation.heroOverlay}
        revealSeconds={invitation.heroRevealSeconds}
        customTexts={invitation.customTexts}
        textStyles={invitation.textStyles}
        confettiEnabled={shouldFireVideoEntranceConfetti(invitation.heroConfetti)}
        onTapped={handleTapped}
        onRevealed={handleRevealed}
        eventType={invitation.eventType}
      />

      <RevealableExternalSections
        invitation={invitation}
        theme={theme}
        revealed={revealed}
        audioRef={audioRef}
      />
    </main>
  );
}
