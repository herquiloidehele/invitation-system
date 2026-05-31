"use client";

import dynamic from "next/dynamic";
import type {
  CustomTexts,
  ImageSettingsMap,
  InvitationData,
  SaveDateStyle,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";

// ---------------------------------------------------------------------------
// Variant code splitting
//
// Each of the 5 variants ships in its own dynamic chunk so an invitation
// only loads the variant matching its `saveDateStyle`. The shared helpers
// (`AccentLine`, `SaveLabel`, `CalendarCTA`) are imported by each variant
// from `./save-the-date-variants/SaveTheDateShared`; turbopack hoists
// that shared module into the common chunk graph automatically, so it
// is downloaded only once.
// ---------------------------------------------------------------------------

const SaveTheDateClassic = dynamic(
  () => import("./save-the-date-variants/SaveTheDateClassic"),
  { ssr: false, loading: () => null },
);
const SaveTheDateCountdown = dynamic(
  () => import("./save-the-date-variants/SaveTheDateCountdown"),
  { ssr: false, loading: () => null },
);
const SaveTheDateQuadCards = dynamic(
  () => import("./save-the-date-variants/SaveTheDateQuadCards"),
  { ssr: false, loading: () => null },
);
const SaveTheDateCinematic = dynamic(
  () => import("./save-the-date-variants/SaveTheDateCinematic"),
  { ssr: false, loading: () => null },
);
const SaveTheDateMinimalLine = dynamic(
  () => import("./save-the-date-variants/SaveTheDateMinimalLine"),
  { ssr: false, loading: () => null },
);

// ---------------------------------------------------------------------------
// Shared props for the dispatcher
// ---------------------------------------------------------------------------

export interface SaveTheDateProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  /** Per-section card background override. Falls back to theme.cardBg. */
  cardBg?: string;
  /** Per-section card border override. Falls back to theme.cardBorder. */
  cardBorder?: string;
  /** Per-section card border-radius override. Falls back to per-variant default. */
  cardBorderRadius?: number;
  onCalendarClick?: () => void;
  isPreview?: boolean;
  /** Per-image position & zoom overrides map. */
  imageSettings?: ImageSettingsMap;
  /** Per-invitation UI text overrides. */
  customTexts?: CustomTexts;
}

// ---------------------------------------------------------------------------
// Main export — dispatches to the correct dynamic variant
// ---------------------------------------------------------------------------

export default function SaveTheDateSection({
  invitation,
  theme: rawTheme,
  ts,
  cardBg,
  cardBorder,
  cardBorderRadius,
  onCalendarClick,
  isPreview,
  imageSettings,
  customTexts,
}: SaveTheDateProps) {
  // Merge per-section card overrides into theme so all variants pick them up
  const theme = {
    ...rawTheme,
    cardBg: cardBg || rawTheme.cardBg,
    cardBorder: cardBorder || rawTheme.cardBorder,
  };
  const style: SaveDateStyle = invitation.saveDateStyle ?? "classic";

  const commonProps = {
    invitation,
    theme,
    ts,
    cardBorderRadius,
    onCalendarClick,
    isPreview,
    customTexts,
  } as const;

  switch (style) {
    case "countdown":
      return <SaveTheDateCountdown {...commonProps} />;
    case "quad-cards":
      return <SaveTheDateQuadCards {...commonProps} />;
    case "cinematic":
      return (
        <SaveTheDateCinematic {...commonProps} imageSettings={imageSettings} />
      );
    case "minimal-line":
      return <SaveTheDateMinimalLine {...commonProps} />;
    case "classic":
    default:
      return <SaveTheDateClassic {...commonProps} />;
  }
}
