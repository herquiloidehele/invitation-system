import type { InvitationData, InvitationType, PublicGuestData } from "./types";
import { slugifyName } from "./guest-links";
import { encodeCanvaPersonalization } from "./canva-personalization";

export function shouldShowExternalInvitationAudioControls(
  invitationType: InvitationType,
): boolean {
  return invitationType === "external_link";
}

export function getExternalInvitationPublicHref(
  slug: string | undefined,
): string | null {
  if (!slug) return null;
  return `/${slug}`;
}

export function getExternalInvitationEmbedSrc(externalLink: string): string {
  try {
    const url = new URL(externalLink);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return externalLink;
    }

    const path = url.pathname === "/" ? "" : url.pathname;
    return `/canva-proxy/${url.host}${path}${url.search}`;
  } catch {
    return externalLink;
  }
}

/**
 * Appends `?hideScrollbar=1` to a `/canva-proxy/...` src so the proxy
 * injects a style block that hides the iframe document's scrollbar while
 * keeping scrolling functional (see `injectIframeHideScrollbarStyle`).
 *
 * Used by the bare-fullscreen `ExternalLinkPage`, whose fixed-size iframe
 * relies on the Canva document's own internal scroll. No-ops for non-proxy
 * srcs (e.g. when `getExternalInvitationEmbedSrc` falls back to the raw
 * external URL) — we only control headers/HTML for URLs we proxy.
 */
export function appendCanvaProxyHideScrollbarFlag(src: string): string {
  if (!src || !src.startsWith("/canva-proxy/")) return src;

  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : src.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);

  params.set("hideScrollbar", "1");

  return `${path}?${params.toString()}${hash}`;
}

export function appendCanvaProxyDisableScrollFlag(src: string): string {
  if (!src) return src;

  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : src.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);

  params.set("disableScroll", "1");

  return `${path}?${params.toString()}${hash}`;
}

/**
 * Appends an opaque `?pz=<payload>` param carrying the guest's personalization
 * values to a `/canva-proxy/...` src. The proxy strips `pz` before the upstream
 * fetch and uses it to replace text tokens + augment the `/confirmar/` link.
 *
 * No-ops for non-proxy srcs and when no guest is present (so generic links,
 * admin preview and the landing demo render the no-guest fallbacks).
 */
export function appendCanvaPersonalizationParams(
  src: string,
  guest: PublicGuestData | null | undefined,
): string {
  if (!src || !src.startsWith("/canva-proxy/") || !guest) return src;

  const pz = encodeCanvaPersonalization({
    name: guest.name,
    companion: guest.companion ?? "",
    tableLabel: guest.tableLabel ?? "",
    totalGuests: guest.totalGuests != null ? String(guest.totalGuests) : "",
    token: guest.token,
    nameSlug: slugifyName(guest.name),
  });

  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : src.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);
  params.set("pz", pz);
  return `${path}?${params.toString()}${hash}`;
}

function parseUrlParts(src: string) {
  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : src.slice(hashIndex);

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(beforeHash)) {
    const url = new URL(beforeHash);

    return {
      hash,
      pathname: url.pathname,
      searchParams: url.searchParams,
    };
  }

  const queryIndex = beforeHash.indexOf("?");

  return {
    hash,
    pathname: queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex),
    searchParams: new URLSearchParams(
      queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1),
    ),
  };
}

function normalizeCanvaEmbedPage(src: string) {
  const { hash, pathname: rawPathname, searchParams } = parseUrlParts(src);
  const pathname =
    rawPathname.length > 1
      ? rawPathname.replace(/\/+$/, "")
      : rawPathname;
  const params = new URLSearchParams(searchParams);

  params.delete("disableScroll");
  params.sort();

  return {
    hash,
    pathname,
    search: params.toString(),
  };
}

function toCanvaProxySrc(src: string): string {
  const { hash, pathname, searchParams } = parseUrlParts(src);
  const search = searchParams.toString();

  if (pathname.startsWith("/canva-proxy/")) {
    return `${pathname}${search ? `?${search}` : ""}${hash}`;
  }

  return src;
}

export function isInitialCanvaEmbedPage(
  currentSrc: string,
  initialSrc: string,
): boolean {
  try {
    const current = normalizeCanvaEmbedPage(currentSrc);
    const initial = normalizeCanvaEmbedPage(initialSrc);

    return (
      !current.hash &&
      current.pathname === initial.pathname &&
      current.search === initial.search
    );
  } catch {
    return currentSrc === initialSrc;
  }
}

export function shouldShowRichExternalRsvp({
  rsvpOn,
  isInitialCanvaPage,
}: {
  rsvpOn: boolean;
  isInitialCanvaPage: boolean;
}): boolean {
  return rsvpOn && isInitialCanvaPage;
}

export function shouldShowVideoEntranceInitialSections({
  isInitialCanvaPage,
}: {
  isInitialCanvaPage: boolean;
}): boolean {
  return isInitialCanvaPage;
}

export function shouldPreloadRichExternalCanva({
  isPreview,
  isVisible,
}: {
  isPreview: boolean;
  isVisible: boolean;
}): boolean {
  return !isPreview && !isVisible;
}

export function resolveCanvaEmbedPageState({
  actualSrc,
  currentNavigatedProxiedUrl,
  externalLink,
  initialSrc,
}: {
  actualSrc: string;
  currentNavigatedProxiedUrl?: { externalLink: string; src: string } | null;
  externalLink: string;
  initialSrc: string;
}): {
  isInitialPage: boolean;
  navigatedProxiedUrl: { externalLink: string; src: string } | null;
} {
  const isInitialPage = isInitialCanvaEmbedPage(actualSrc, initialSrc);

  return {
    isInitialPage,
    navigatedProxiedUrl: isInitialPage
      ? (currentNavigatedProxiedUrl ?? null)
      : {
          externalLink,
          src: appendCanvaProxyDisableScrollFlag(toCanvaProxySrc(actualSrc)),
        },
  };
}

/**
 * Returns true if an external_link invitation has any optional rich section
 * enabled (hero — implicit via heroImage/videoUrl presence, countdown,
 * scratch reveal, or an end-of-page RSVP form via rsvp.showOnExternalPage).
 * Used by the public renderer to choose between the bare fullscreen-iframe
 * layout and the scrollable rich-sections layout.
 */
export function hasRichExternalSections(invitation: InvitationData): boolean {
  if ((invitation.invitationType ?? "standard") !== "external_link")
    return false;
  const heroOn = Boolean(invitation.heroImage || invitation.videoUrl);
  const countdownOn = Boolean(invitation.countdown?.enabled);
  const scratchOn = Boolean(invitation.scratchReveal?.enabled);
  // Opt a bare external link into the scrollable rich layout when the RSVP
  // form is enabled and configured to render at the end of the page.
  const rsvpAtEndOn = Boolean(
    invitation.rsvp?.enabled && invitation.rsvp?.showOnExternalPage,
  );
  return heroOn || countdownOn || scratchOn || rsvpAtEndOn;
}
