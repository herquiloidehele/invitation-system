"use client";

import { useDynamicFonts } from "@/hooks/useDynamicFont";
import type { TemplateTheme } from "@/lib/types";

/**
 * Loads any non-builtin Google Fonts used by the current theme.
 *
 * Drop this component near the top of the invitation page tree. It reads the
 * theme's four font roles (displayFont, bodyFont, scriptFont, uiFont) and
 * dynamically injects <link> tags for fonts that aren't already loaded via
 * next/font/google in the root layout.
 *
 * For the 10 builtin fonts this is a no-op — they're already self-hosted.
 */
export default function DynamicFontLoader({ theme }: { theme: TemplateTheme }) {
  useDynamicFonts([
    theme.displayFont,
    theme.bodyFont,
    theme.scriptFont,
    theme.uiFont,
  ]);

  return null;
}
