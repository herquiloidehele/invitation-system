import type { CSSProperties } from "react";
import type {
  CardStyle,
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
 * The damask pattern behind the whole elegant-floral page. Sits on the page
 * root so every section scrolls over it; `theme.bg` still paints the base
 * colour underneath, which shows through the asset's cream ground.
 */
export const EF_BACKGROUND_PATTERN =
  "/images/themes/elegant-floral/damask.webp";

/**
 * Tile width in px. The damask is drawn at phone-screen scale, so pinning the
 * width keeps one motif roughly one handset wide and stops the pattern
 * stretching on desktop — it repeats instead.
 *
 * This is twice the source artwork's width because `damask.webp` is a
 * horizontally mirrored pair (see that folder's README): displaying the pair at
 * 840px renders each motif at the 420px the original was drawn for.
 */
export const EF_BACKGROUND_TILE_WIDTH = 840;

/**
 * Background style for the elegant-floral page root: a tiled pattern over
 * `theme.bg`.
 *
 * `customUrl` is the per-invitation `pageBackgroundImageUrl` upload. It is
 * tiled on exactly the same terms as the bundled damask it replaces, so an
 * uploaded pattern keeps the motif scale the layout is built around. Blank or
 * missing falls back to the damask — the admin's "Repor" button clears the
 * field to `""`, and that has to mean "use the default", not "no background".
 */
export function efPageBackgroundStyle(
  theme: Pick<TemplateTheme, "bg">,
  customUrl?: string | null,
): CSSProperties {
  const custom = customUrl?.trim();
  return {
    backgroundColor: theme.bg,
    backgroundImage: `url(${custom || EF_BACKGROUND_PATTERN})`,
    backgroundRepeat: "repeat",
    backgroundSize: `${EF_BACKGROUND_TILE_WIDTH}px auto`,
    backgroundPosition: "top center",
  };
}

/**
 * Card surface for the guest-guide item grid on this layout.
 *
 * Defaults to the translucent wash the gifts grid uses (see GiftsSection) so
 * the damask page background reads through each tile instead of twelve opaque
 * rectangles punching holes in it. A per-invitation `cardStyles.guestGuide`
 * override still wins, so the admin's card controls keep working here.
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
