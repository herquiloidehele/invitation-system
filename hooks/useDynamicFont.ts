"use client";

import { useEffect, useRef } from "react";
import { BUILTIN_FONT_FAMILIES, buildGoogleFontUrl } from "@/lib/google-fonts";

const builtinSet = new Set(BUILTIN_FONT_FAMILIES.map((f) => f.toLowerCase()));

/** Set of font families already injected in this browser session. */
const injectedFonts = new Set<string>();

/**
 * Dynamically load a Google Font by injecting a <link> into <head>.
 *
 * - Skips fonts that are already loaded as builtins via next/font/google.
 * - Skips fonts that have already been injected in this session.
 * - Uses `display=swap` for instant text rendering.
 *
 * @param family - The bare font family name (e.g. "Playfair Display")
 * @param weights - Optional array of weights to load (default: 300–700)
 */
export function useDynamicFont(
  family: string | undefined | null,
  weights?: number[],
) {
  const prevFamily = useRef<string | null>(null);

  useEffect(() => {
    if (!family) return;

    // Normalise: strip quotes and generic fallback
    const bare = family
      .split(",")[0]
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!bare) return;

    // Skip builtins — they're already loaded via next/font/google
    if (builtinSet.has(bare.toLowerCase())) return;

    // Skip if already injected
    if (injectedFonts.has(bare)) return;

    // Avoid duplicate links if React re-renders
    const linkId = `dynamic-font-${bare.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(linkId)) {
      injectedFonts.add(bare);
      return;
    }

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = buildGoogleFontUrl(bare, weights);
    document.head.appendChild(link);
    injectedFonts.add(bare);

    prevFamily.current = bare;
  }, [family, weights]);
}

/**
 * Load multiple Google Fonts at once. Useful for the invitation page where
 * we have 4 font roles (display, body, script, ui).
 */
export function useDynamicFonts(families: (string | undefined | null)[]) {
  // We call useDynamicFont per slot — but we can't call hooks in a loop.
  // Instead, dedupe and inject imperatively.
  useEffect(() => {
    const toLoad: string[] = [];

    for (const raw of families) {
      if (!raw) continue;
      const bare = raw
        .split(",")[0]
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!bare) continue;
      if (builtinSet.has(bare.toLowerCase())) continue;
      if (injectedFonts.has(bare)) continue;

      const linkId = `dynamic-font-${bare.replace(/\s+/g, "-").toLowerCase()}`;
      if (document.getElementById(linkId)) {
        injectedFonts.add(bare);
        continue;
      }

      toLoad.push(bare);
    }

    for (const bare of toLoad) {
      const linkId = `dynamic-font-${bare.replace(/\s+/g, "-").toLowerCase()}`;
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = buildGoogleFontUrl(bare);
      document.head.appendChild(link);
      injectedFonts.add(bare);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [families.filter(Boolean).join("|")]);
}
