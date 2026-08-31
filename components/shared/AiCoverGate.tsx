"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";

import EnvelopeCover from "@/components/shared/EnvelopeCover";
import VideoSequenceCover from "@/components/shared/VideoSequenceCover";
import { shouldRenderVideoSequenceCover } from "@/lib/cover-videos";
import {
  fireCelebrationConfetti,
  resolveEnvelopeConfettiColors,
} from "@/lib/confetti";
import { useAiAudio } from "@/components/shared/ai/AiAudioContext";
import type { InvitationData, TemplateTheme } from "@/lib/types";

interface AiCoverGateProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /**
   * Start already opened, with no cover drawn. Used by the admin builder
   * preview, where the designer wants the invitation itself, not the envelope.
   * Audio is not primed in this mode — there is no tap to grant the gesture.
   */
  skipCover?: boolean;
  /** Rendered behind the cover; receives the opened flag. */
  children: (opened: boolean) => ReactNode;
}

/**
 * The platform-owned cover for AI invitations: the same envelope and
 * video-sequence covers the standard renderer uses, configured by the same
 * admin fields.
 *
 * The tap is the browser's gesture grant for audio and video playback, which is
 * exactly why the cover stays platform-owned and is never generated code.
 */
export default function AiCoverGate({
  invitation,
  theme,
  skipCover = false,
  children,
}: AiCoverGateProps) {
  const [opened, setOpened] = useState(skipCover);
  const [coverVisible, setCoverVisible] = useState(!skipCover);
  const [videoCoverFailed, setVideoCoverFailed] = useState(false);

  const usesVideoCover =
    shouldRenderVideoSequenceCover(invitation.coverVideos) && !videoCoverFailed;

  // Per-invitation envelope overrides on top of the theme defaults, matching
  // the standard renderer's behaviour.
  const mergedTheme = useMemo<TemplateTheme>(() => {
    const overrides = invitation.envelope;
    if (!overrides) return theme;
    return {
      ...theme,
      envelope: {
        base: overrides.base || theme.envelope.base,
        topFlap: overrides.topFlap || theme.envelope.topFlap,
        bottomFlap: overrides.bottomFlap || theme.envelope.bottomFlap,
      },
    };
  }, [theme, invitation.envelope]);

  const handleAnimationComplete = useCallback(() => {
    const confettiColors = resolveEnvelopeConfettiColors(
      invitation.envelope,
      theme,
    );
    if (confettiColors) fireCelebrationConfetti(confettiColors);

    setOpened(true);
    requestAnimationFrame(() => setCoverVisible(false));
  }, [invitation.envelope, theme]);

  const audio = useAiAudio();
  // The cover tap is the browser's gesture grant for audio playback — prime the
  // background music here, within the tap, exactly as the standard renderer does.
  const handleOpen = useCallback(() => {
    audio?.start();
  }, [audio]);

  return (
    <>
      {children(opened)}
      {coverVisible &&
        (usesVideoCover ? (
          <VideoSequenceCover
            items={invitation.coverVideos!.items}
            onOpen={handleOpen}
            onAnimationComplete={handleAnimationComplete}
            onUnavailable={() => setVideoCoverFailed(true)}
          />
        ) : (
          <EnvelopeCover
            theme={mergedTheme}
            coverBackground={invitation.envelope?.coverBackground}
            onOpen={handleOpen}
            onAnimationComplete={handleAnimationComplete}
            monogram={invitation.couple.monogram}
            shimmer={invitation.envelope?.shimmer !== false}
            imageSettings={invitation.imageSettings}
          />
        ))}
    </>
  );
}
