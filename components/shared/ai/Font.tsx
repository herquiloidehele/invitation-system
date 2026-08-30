"use client";

import { useDynamicFonts } from "@/hooks/useDynamicFont";
import type { FontProps } from "@/lib/ai-primitive-types";

/**
 * Loads a Google or admin-uploaded font family on demand (injects the font
 * link/face if not already self-hosted), then renders nothing. The generated
 * bundle drops `<Font family="Playfair Display" />` near its root and uses the
 * family in CSS.
 */
export default function Font({ family }: FontProps): null {
  useDynamicFonts([family]);
  return null;
}
