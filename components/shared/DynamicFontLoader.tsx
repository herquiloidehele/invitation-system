"use client";

import { useMemo } from "react";
import { useDynamicFonts } from "@/hooks/useDynamicFont";
import type { InvitationStyles, TextStyleOverrides } from "@/lib/types";

/**
 * Loads any non-builtin Google Fonts used by the current theme AND any
 * element-level font overrides chosen via the inline text editor.
 *
 * Drop this component near the top of the invitation page tree. It reads the
 * theme's font roles (displayFont, bodyFont, scriptFont, uiFont,
 * sectionTitleFont) plus any per-element fontFamily overrides from
 * `textStyles.elements`, and dynamically injects <link> tags for fonts that
 * aren't already loaded via next/font/google in the root layout.
 *
 * For the 10 builtin fonts this is a no-op — they're already self-hosted.
 */
export default function DynamicFontLoader({
  theme,
  textStyles,
}: {
  theme: InvitationStyles;
  textStyles?: TextStyleOverrides;
}) {
  // Collect element-level fontFamily overrides (stable reference via useMemo)
  const elementFonts = useMemo(() => {
    if (!textStyles?.elements) return [];
    return Object.values(textStyles.elements)
      .map((el) => el?.fontFamily)
      .filter((f): f is string => !!f);
  }, [textStyles?.elements]);

  useDynamicFonts([
    theme.displayFont,
    theme.bodyFont,
    theme.scriptFont,
    theme.uiFont,
    theme.sectionTitleFont,
    // Role-level font overrides
    textStyles?.fonts?.display,
    textStyles?.fonts?.body,
    textStyles?.fonts?.script,
    textStyles?.fonts?.ui,
    textStyles?.fonts?.sectionTitle,
    // Element-level font overrides
    ...elementFonts,
  ]);

  return null;
}
