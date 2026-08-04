"use client";

import { useDynamicFonts } from "@/hooks/useDynamicFont";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";

/**
 * Loads any non-builtin Google or admin-uploaded custom fonts used by the
 * current theme and element-level overrides chosen via the inline editor.
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
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides;
}) {
  const elementFonts = Object.values(textStyles?.elements ?? {})
    .map((element) => element?.fontFamily)
    .filter((font): font is string => Boolean(font));

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
