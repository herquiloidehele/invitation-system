"use client";

import { useCallback, useRef, useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import VideoEntranceHero from "./VideoEntranceHero";
import RevealableExternalSections from "@/components/shared/RevealableExternalSections";
import ImageCanvas from "@/components/shared/ImageCanvas";
import SectionImageHost from "@/components/shared/SectionImageHost";
import { useRevealScrollLock } from "@/hooks/useRevealScrollLock";
import { getEffectiveExternalLink } from "@/lib/invitation-external-link";
import { shouldShowVideoEntranceInitialSections } from "@/lib/external-invitation-form";
import { resolveHeroMediaFit } from "@/lib/hero-media-fit";
import {
  shouldFireVideoEntranceConfetti,
  shouldShowTapPrompt,
} from "@/lib/video-entrance";
import {
  getEntranceInvitationImageSectionKeys,
  isEntranceImageMigrationReady,
} from "@/lib/entrance-invitation-image-sections";

interface VideoEntrancePageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function VideoEntrancePage({
  invitation,
  theme,
}: VideoEntrancePageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  const [canvaPageState, setCanvaPageState] = useState<{
    externalLink: string;
    isInitialPage: boolean;
  } | null>(null);
  const [measuredExternalLink, setMeasuredExternalLink] = useState<
    string | null
  >(null);
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
  const handleCanvaContentHeightReady = useCallback(
    () => setMeasuredExternalLink(externalLink),
    [externalLink],
  );
  const hostedSectionKeys = getEntranceInvitationImageSectionKeys(invitation, {
    showInitialPageSections,
  });
  const imageMigrationReady = isEntranceImageMigrationReady({
    revealed,
    externalLink,
    measuredExternalLink,
  });
  useRevealScrollLock(revealed);

  return (
    <main
      className="min-h-dvh"
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        overflowX: "clip",
        overflowAnchor: "none",
      }}
    >
      <ImageCanvas
        layer={invitation.imageLayer}
        frontLayerPosition="interleaved"
        hostedSectionKeys={hostedSectionKeys}
        migrationReady={imageMigrationReady}
      >
        <div style={{ display: showInitialPageSections ? undefined : "none" }}>
          <SectionImageHost
            sectionKey="hero"
            layer={invitation.imageLayer}
            frontLayerPosition="interleaved"
          >
            <VideoEntranceHero
              invitation={invitation}
              couple={invitation.couple}
              topText={invitation.heroTopText}
              quote={invitation.quote}
              theme={theme}
              audioRef={audioRef}
              videoUrl={invitation.videoUrl}
              videoPoster={invitation.videoPoster}
              mediaFit={resolveHeroMediaFit(invitation.heroMediaFit)}
              heroOverlay={invitation.heroOverlay}
              heroScrollIndicator={invitation.heroScrollIndicator}
              revealSeconds={invitation.heroRevealSeconds}
              customTexts={invitation.customTexts}
              textStyles={invitation.textStyles}
              confettiEnabled={shouldFireVideoEntranceConfetti(
                invitation.heroConfetti,
              )}
              showTapPrompt={shouldShowTapPrompt(invitation.heroTapPrompt)}
              onRevealed={handleRevealed}
              eventType={invitation.eventType}
              heroTextLayer={invitation.heroTextLayer}
            />
          </SectionImageHost>
        </div>

        <RevealableExternalSections
          invitation={invitation}
          theme={theme}
          revealed={revealed}
          audioRef={audioRef}
          imageLayer={invitation.imageLayer}
          showInitialPageSections={showInitialPageSections}
          onCanvaInitialPageChange={(isInitialPage) =>
            setCanvaPageState({ externalLink, isInitialPage })
          }
          onCanvaContentHeightReady={handleCanvaContentHeightReady}
        />
      </ImageCanvas>
    </main>
  );
}
