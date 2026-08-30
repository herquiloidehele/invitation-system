"use client";

import { useLocale } from "next-intl";

import AiBundleMount from "@/components/shared/AiBundleMount";
import AiCoverGate from "@/components/shared/AiCoverGate";
import AiRuntimeProvider from "@/components/shared/AiRuntimeProvider";
import PlatformProvider from "@/components/shared/ai/PlatformProvider";
import { buildAiBundleProps } from "@/lib/ai-invitation-props";
import type { InvitationData, TemplateTheme } from "@/lib/types";

interface AiInvitationViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
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
}: AiInvitationViewProps) {
  const locale = useLocale();
  const bundleUrl = invitation.aiBundleUrl;

  if (!bundleUrl) return null;

  return (
    <AiRuntimeProvider>
      <AiCoverGate invitation={invitation} theme={theme}>
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
          </PlatformProvider>
        )}
      </AiCoverGate>
    </AiRuntimeProvider>
  );
}
