import type { CSSProperties } from "react";
import type {
  CardStyle,
  TemplateTheme,
  LocationInfo,
  LocationPhoto,
  ParentsInfo,
  PersonalGuestCardConfig,
  PublicGuestData,
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
 * The two opening-text arrangements this layout offers: blessing → parents →
 * invite → names, or verse → names → invite when there are no parents.
 */
export type EfTextOrder = "with-parents" | "verse-first";

/**
 * Which opening-text arrangement to render, driven by the parents-mode switch:
 * on keeps the parents order, off (or no parents block at all) gives the
 * verse-first order.
 */
export function resolveEfTextOrder(
  parents: Pick<ParentsInfo, "enabled"> | null | undefined,
): EfTextOrder {
  return parents?.enabled ? "with-parents" : "verse-first";
}

/**
 * The lines above the announcement: the verse (the invitation's quote) always
 * leads, followed by the parents' blessing when parents mode is on. A blank
 * line comes back null so it isn't rendered at all.
 */
export function efOpeningLines(invitation: {
  parents?: Pick<ParentsInfo, "enabled" | "blessingMessage">;
  quote?: string | null;
}): { verse: string | null; blessing: string | null } {
  const { parents, quote } = invitation;
  const present = (line: string | null | undefined) =>
    line?.trim() ? line : null;
  return {
    verse: present(quote),
    blessing:
      resolveEfTextOrder(parents) === "with-parents"
        ? present(parents?.blessingMessage)
        : null,
  };
}

/**
 * The name printed on the guest line under the couple names, or null when the
 * line shouldn't render: it is opt-in per invitation, and only for a guest
 * opening their personal link. A companion shares the line.
 *
 * `sampleGuest` stands in when there is no real guest — the admin preview
 * passes one so the line can be styled. It never switches the line on.
 */
export function efGuestLineName(
  invitation: {
    guest?: Pick<PublicGuestData, "name" | "companion"> | null;
    personalGuestCard?: Pick<PersonalGuestCardConfig, "guestLine"> | null;
  },
  sampleGuest?: Pick<PublicGuestData, "name" | "companion"> | null,
): string | null {
  if (invitation.personalGuestCard?.guestLine !== true) return null;
  const guest = invitation.guest ?? sampleGuest;
  const name = guest?.name?.trim();
  if (!name) return null;
  const companion = guest?.companion?.trim();
  return companion ? `${name} & ${companion}` : name;
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

/**
 * Style for a schedule row's venue line.
 *
 * The venue used to be styled as `efBody`, which it shared with the dress-code
 * and gift copy — so centring those pulled the venue out from under its label
 * on the timeline. It now has its own key and takes its alignment from the row
 * (left beside the rail, centred in the stack). `efBody`'s font, size and
 * colour still apply underneath, so invitations styled before the key existed
 * look the same apart from that alignment.
 */
export function efScheduleVenueStyle(
  base: CSSProperties,
  textStyles: TextStyleOverrides | null | undefined,
): CSSProperties {
  const body = textStyles?.elements?.efBody;
  return efStyle(
    applyOverride(base, body && { ...body, textAlign: undefined }),
    textStyles,
    "efScheduleVenue",
  );
}
