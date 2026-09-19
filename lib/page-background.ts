import type { CSSProperties } from "react";
import type { TemplateTheme } from "./types";

/**
 * How a host-uploaded background tiles: full column width, repeating down the
 * page.
 *
 * Uploads are arbitrary artwork, so the only scale that behaves predictably is
 * the one the host can see coming — their image spans the invitation column and
 * stacks vertically. A bundled pattern is different: its tile width is measured
 * against the specific artwork, so it carries its own (see PageBackgroundFallback).
 */
export const UPLOADED_BACKGROUND_SIZE = "100% auto";

/** A layout's own bundled pattern, used when the host has not uploaded one. */
export interface PageBackgroundFallback {
  /** Public path of the bundled artwork. */
  url: string;
  /** Tile width in px, tuned for that artwork specifically. */
  tileWidth: number;
}

/**
 * Background style for an invitation page root.
 *
 * With no upload and no bundled fallback this returns the background colour and
 * nothing else — byte-identical to what every layout did before the upload
 * existed, which is what keeps already-shipped invitations from moving. Only
 * elegant-floral passes a fallback; every other layout opts in per invitation
 * or stays bare.
 *
 * A blank or whitespace-only `customUrl` counts as "not set": the admin's reset
 * button clears the field to `""`, and that has to mean "use the default", not
 * "no background".
 */
export function pageBackgroundStyle(
  theme: Pick<TemplateTheme, "bg">,
  customUrl?: string | null,
  fallback?: PageBackgroundFallback,
): CSSProperties {
  const custom = customUrl?.trim();
  const base: CSSProperties = { backgroundColor: theme.bg };

  if (custom) {
    return {
      ...base,
      backgroundImage: `url(${custom})`,
      backgroundRepeat: "repeat",
      backgroundSize: UPLOADED_BACKGROUND_SIZE,
      backgroundPosition: "top center",
    };
  }

  if (fallback) {
    return {
      ...base,
      backgroundImage: `url(${fallback.url})`,
      backgroundRepeat: "repeat",
      backgroundSize: `${fallback.tileWidth}px auto`,
      backgroundPosition: "top center",
    };
  }

  return base;
}
