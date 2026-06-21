import type { CSSProperties } from "react";
import type {
  TemplateTheme,
  LocationInfo,
  LocationPhoto,
  TextStyleOverrides,
} from "./types";
import { applyOverride } from "./text-styles";

/**
 * Returns true when the theme should render via the ElegantFloralPage pipeline.
 * The layout still flows through EnvelopeInvitationView (themed envelope cover);
 * only the post-envelope content is swapped (see InvitationView.renderContent).
 */
export function isElegantFloralLayout(
  theme: Pick<TemplateTheme, "layout"> | { layout?: string | null },
): boolean {
  return theme.layout === "elegant-floral";
}

/**
 * Venue photos for the LocationCard carousel: the explicit `photos` array when
 * present (blank-src entries dropped), else a single-item list from the legacy
 * `imageUrl` so older invitations still show their image. Empty otherwise.
 */
export function resolveLocationPhotos(
  location: Pick<LocationInfo, "photos" | "imageUrl"> | null | undefined,
): LocationPhoto[] {
  if (!location) return [];
  const photos = location.photos?.filter((p) => p.src && p.src.trim());
  if (photos && photos.length > 0) return photos;
  const legacy = location.imageUrl?.trim();
  return legacy ? [{ src: legacy }] : [];
}

/** Wrap a carousel index into [0, length) so prev/next never overflow. */
export function wrapCarouselIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

/**
 * Split the milliseconds between `nowMs` and the target ISO date into
 * day/hour/minute/second parts. Clamps to zero (done=true) once the target has
 * passed or when the date can't be parsed.
 */
export function countdownPartsFrom(
  targetIso: string,
  nowMs: number,
): CountdownParts {
  const target = Date.parse(targetIso);
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  if (!Number.isFinite(target)) return zero;
  const diff = target - nowMs;
  if (diff <= 0) return zero;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  };
}

// ---------------------------------------------------------------------------
// Inline text-style editing
// ---------------------------------------------------------------------------

/** Element keys available to the elegant-floral inline text editor. */
export type EfTextKey = keyof NonNullable<TextStyleOverrides["elements"]>;

/**
 * Merge the admin's per-element text-style override (font / size / color /
 * weight / letter-spacing) over a component's base style. With no override the
 * base is returned unchanged, so the public page renders identically.
 */
export function efStyle(
  base: CSSProperties,
  textStyles: TextStyleOverrides | null | undefined,
  key: EfTextKey,
): CSSProperties {
  return applyOverride(base, textStyles?.elements?.[key]);
}
