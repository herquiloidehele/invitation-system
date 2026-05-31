"use client";

import { useEffect, useRef } from "react";
import { BUILTIN_FONT_FAMILIES, buildGoogleFontUrl } from "@/lib/google-fonts";

const builtinSet = new Set(BUILTIN_FONT_FAMILIES.map((f) => f.toLowerCase()));

/**
 * Module-level reference count of currently-active subscriptions per
 * font family. We append the <link> the first time anyone asks for the
 * family and remove it again when the last subscriber unmounts. This
 * lets long-lived admin sessions that preview many themes recover the
 * font CSS memory instead of accumulating it forever.
 */
const refCounts = new Map<string, number>();
const linkElements = new Map<string, HTMLLinkElement>();

function normalize(family: string): string {
  return family
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function acquireFont(bare: string, weights?: number[]) {
  if (!bare) return;
  if (builtinSet.has(bare.toLowerCase())) return;

  const current = refCounts.get(bare) ?? 0;
  refCounts.set(bare, current + 1);
  if (current > 0) return; // someone else already injected the <link>

  const linkId = `dynamic-font-${bare.replace(/\s+/g, "-").toLowerCase()}`;
  const existing = document.getElementById(linkId) as HTMLLinkElement | null;
  if (existing) {
    linkElements.set(bare, existing);
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = buildGoogleFontUrl(bare, weights);
  document.head.appendChild(link);
  linkElements.set(bare, link);
}

function releaseFont(bare: string) {
  if (!bare) return;
  if (builtinSet.has(bare.toLowerCase())) return;

  const current = refCounts.get(bare) ?? 0;
  if (current <= 1) {
    refCounts.delete(bare);
    const link = linkElements.get(bare);
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
    linkElements.delete(bare);
  } else {
    refCounts.set(bare, current - 1);
  }
}

/**
 * Dynamically load a Google Font by injecting a <link> into <head>.
 *
 * - Skips fonts that are already loaded as builtins via next/font/google.
 * - Reference-counts subscribers so the <link> is removed when the last
 *   subscriber unmounts.
 * - Uses `display=swap` for instant text rendering.
 */
export function useDynamicFont(
  family: string | undefined | null,
  weights?: number[],
) {
  const acquiredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!family) return;
    const bare = normalize(family);
    if (!bare) return;

    acquireFont(bare, weights);
    acquiredRef.current = bare;

    return () => {
      if (acquiredRef.current) {
        releaseFont(acquiredRef.current);
        acquiredRef.current = null;
      }
    };
  }, [family, weights]);
}

/**
 * Load multiple Google Fonts at once. Useful for the invitation page where
 * we have 4 font roles (display, body, script, ui). Each family is
 * reference-counted individually so families shared across mounts stay
 * loaded as long as anyone needs them.
 */
export function useDynamicFonts(families: (string | undefined | null)[]) {
  const familiesKey = families.filter(Boolean).join("|");
  const acquiredRef = useRef<string[]>([]);

  useEffect(() => {
    const acquired: string[] = [];
    for (const raw of families) {
      if (!raw) continue;
      const bare = normalize(raw);
      if (!bare) continue;
      if (builtinSet.has(bare.toLowerCase())) continue;
      acquireFont(bare);
      acquired.push(bare);
    }
    acquiredRef.current = acquired;

    return () => {
      for (const bare of acquiredRef.current) {
        releaseFont(bare);
      }
      acquiredRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familiesKey]);
}
