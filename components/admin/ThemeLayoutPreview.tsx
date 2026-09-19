"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import InvitationPage from "@/components/shared/InvitationPage";
import ElegantFloralPage from "@/components/elegant-floral/ElegantFloralPage";
import MinimalismBrownPage from "@/components/minimalism-brown/MinimalismBrownPage";
import { isCurtainCanvaLayout } from "@/lib/curtain-canva";
import { isElegantFloralLayout } from "@/lib/elegant-floral";
import { isMinimalismBrownLayout } from "@/lib/minimalism-brown";
import { isVideoEntranceLayout } from "@/lib/video-entrance";

interface ThemeLayoutPreviewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

/**
 * Renders a theme the way the public invitation renderer would.
 *
 * The admin template screens used to hard-code InvitationPage, so a
 * minimalism-brown or elegant-floral template previewed as the default one.
 * This mirrors the branch order in app/[locale]/[slug]/InvitationView.tsx so
 * both stay in step: bespoke layouts first, default page last.
 */
export default function ThemeLayoutPreview({
  invitation,
  theme,
}: ThemeLayoutPreviewProps) {
  if (isMinimalismBrownLayout(theme)) {
    return (
      <MinimalismBrownPage
        invitation={invitation}
        theme={theme}
        isPreview
        animateHeroText
      />
    );
  }

  if (isElegantFloralLayout(theme)) {
    return (
      <ElegantFloralPage
        invitation={invitation}
        theme={theme}
        isPreview
        animateHeroText
      />
    );
  }

  // The entrance layouts are deliberately not embedded here. They render their
  // own full-page shell around a reveal scroll-lock that pins document.body
  // until the curtain/entrance video finishes — inside the admin that would
  // freeze the whole editor — and they have nothing to show without the Canva
  // link and video that only a real invitation carries.
  if (isCurtainCanvaLayout(theme) || isVideoEntranceLayout(theme)) {
    return <EntranceLayoutNotice theme={theme} />;
  }

  return <InvitationPage invitation={invitation} theme={theme} isPreview />;
}

function EntranceLayoutNotice({ theme }: { theme: TemplateTheme }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
      style={{ background: theme.bg, color: theme.textSecondary }}
    >
      <p
        className="text-base"
        style={{ fontFamily: theme.displayFont, color: theme.textPrimary }}
      >
        Pré-visualização indisponível
      </p>
      <p className="text-xs leading-relaxed" style={{ fontFamily: theme.uiFont }}>
        O layout &laquo;{theme.layout}&raquo; abre com o vídeo de entrada e o
        link Canva de um convite concreto. Abra um convite que use este modelo
        para o ver.
      </p>
    </div>
  );
}
