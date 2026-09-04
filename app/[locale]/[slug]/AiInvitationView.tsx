"use client";

import { useLocale } from "next-intl";

import AiBundleMount from "@/components/shared/AiBundleMount";
import AiCoverGate from "@/components/shared/AiCoverGate";
import AiRuntimeProvider from "@/components/shared/AiRuntimeProvider";
import AiAudioProvider from "@/components/shared/ai/AiAudioProvider";
import AiPreviewCaptureBridge from "@/components/shared/ai/AiPreviewCaptureBridge";
import PlatformProvider from "@/components/shared/ai/PlatformProvider";
import { buildAiBundleProps } from "@/lib/ai-invitation-props";
import type { InvitationData, TemplateTheme } from "@/lib/types";

interface AiInvitationViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** Admin builder preview: render the invitation itself, not the envelope. */
  skipCover?: boolean;
}

/**
 * Renderer for `renderMode: "ai"`. Deliberately parallel to
 * EnvelopeInvitationView rather than a refactor of it — the standard path's
 * cover logic is entangled with audio priming, hero-video prefetch and the
 * external-link branches, and must not change.
 */
export default function AiInvitationView({
  invitation,
  theme,
  skipCover = false,
}: AiInvitationViewProps) {
  const locale = useLocale();
  const bundleUrl = invitation.aiBundleUrl;

  if (!bundleUrl) return null;

  return (
    <AiRuntimeProvider>
      <AiAudioProvider invitation={invitation}>
        <AiCoverGate invitation={invitation} theme={theme} skipCover={skipCover}>
          {(opened) => (
            <PlatformProvider invitation={invitation} guest={invitation.guest ?? null}>
              <AiBundleMount
                url={bundleUrl}
                bundleId={invitation.slug}
                props={buildAiBundleProps({
                  invitation,
                  locale,
                  coverOpened: opened,
                })}
              />
              {/* Only the authenticated admin preview is ever framed by the
                  builder, so the public page never ships this listener. */}
              {skipCover && <AiPreviewCaptureBridge />}
            </PlatformProvider>
          )}
        </AiCoverGate>
      </AiAudioProvider>
    </AiRuntimeProvider>
  );
}
