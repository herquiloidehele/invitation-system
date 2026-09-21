import type { CSSProperties } from "react";
import type { TemplateTheme } from "./types";

/**
 * How a host-uploaded background tiles: full column width, repeating down the
 * page.
 *
 * Uploads are arbitrary artwork, so the only scale that behaves predictably is
 * the one the host can see coming — their image spans the invitation column and
 * stacks vertically.
 */
export const UPLOADED_BACKGROUND_SIZE = "100% auto";

/**
 * Background style for an invitation page root.
 *
 * No layout bundles a pattern of its own: with no upload this returns the
 * background colour and nothing else, on every layout. A host who wants a
 * patterned page uploads one from the invitation edit page.
 *
 * A blank or whitespace-only `customUrl` counts as "not set" — the admin's
 * clear button empties the field to `""`.
 */
export function pageBackgroundStyle(
  theme: Pick<TemplateTheme, "bg">,
  customUrl?: string | null,
): CSSProperties {
  const custom = customUrl?.trim();
  const base: CSSProperties = { backgroundColor: theme.bg };

  if (!custom) return base;

  return {
    ...base,
    backgroundImage: `url(${custom})`,
    backgroundRepeat: "repeat",
    backgroundSize: UPLOADED_BACKGROUND_SIZE,
    backgroundPosition: "top center",
  };
}
