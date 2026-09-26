import type { CSSProperties } from "react";
import type {
  CardStyle,
  TemplateTheme,
  LocationInfo,
  LocationPhoto,
  ScheduleStyle,
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
 * Card surface for the guest-guide item grid on this layout.
 *
 * Defaults to the translucent wash the gifts grid uses (see GiftsSection) so
 * a host-uploaded page background reads through each tile instead of twelve
 * opaque rectangles punching holes in it. A per-invitation
 * `cardStyles.guestGuide` override still wins, so the admin's card controls
 * keep working here.
 */
export function efGuestGuideCardStyle(
  theme: Pick<TemplateTheme, "secondary">,
  override?: CardStyle | null,
): { cardBg: string; cardBorder: string; plain: boolean } {
  return {
    cardBg:
      override?.cardBg ||
      `color-mix(in srgb, ${theme.secondary} 8%, transparent)`,
    cardBorder:
      override?.cardBorder ||
      `color-mix(in srgb, ${theme.secondary} 28%, transparent)`,
    plain: override?.plain === true,
  };
}

/** The two schedule renderings this layout offers. */
export type EfScheduleStyle = "timeline" | "stacked";

/**
 * Which schedule markup the elegant-floral layout renders for an invitation's
 * stored `scheduleStyle`.
 *
 * The scroll-driven timeline is what every existing invitation shows, so it
 * stays the answer for an unset value and for "default". "illustrated" is a
 * platform style this layout never rendered, so it maps to the timeline too
 * rather than to a blank section. Only an explicit "stacked" brings back the
 * centered label/time/venue list.
 */
export function resolveEfScheduleStyle(
  scheduleStyle: ScheduleStyle | string | null | undefined,
): EfScheduleStyle {
  return scheduleStyle === "stacked" ? "stacked" : "timeline";
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
