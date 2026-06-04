"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import VideoEntranceHero from "./VideoEntranceHero";
import RevealableExternalSections from "@/components/shared/RevealableExternalSections";
import { useRevealScrollLock } from "@/hooks/useRevealScrollLock";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";
import { shouldShowVideoEntranceInitialSections } from "@/lib/external-invitation-form";
import {
  shouldFireVideoEntranceConfetti,
  shouldShowTapPrompt,
} from "@/lib/video-entrance";

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
  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  const [canvaPageState, setCanvaPageState] = useState<{
    externalLink: string;
    isInitialPage: boolean;
  } | null>(null);
  const isInitialCanvaPage =
    canvaPageState?.externalLink === externalLink
      ? canvaPageState.isInitialPage
      : true;
  const showInitialPageSections = shouldShowVideoEntranceInitialSections({
    isInitialCanvaPage,
  });

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
      <div style={{ display: showInitialPageSections ? undefined : "none" }}>
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
          confettiEnabled={shouldFireVideoEntranceConfetti(
            invitation.heroConfetti,
          )}
          showTapPrompt={shouldShowTapPrompt(invitation.heroTapPrompt)}
          onTapped={handleTapped}
          onRevealed={handleRevealed}
          eventType={invitation.eventType}
        />
      </div>

      <RevealableExternalSections
        invitation={invitation}
        theme={theme}
        revealed={revealed}
        audioRef={audioRef}
        showInitialPageSections={showInitialPageSections}
        onCanvaInitialPageChange={(isInitialPage) =>
          setCanvaPageState({ externalLink, isInitialPage })
        }
      />
    </main>
  );
}
