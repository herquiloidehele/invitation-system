import type { AppLocale } from "@/i18n/locales";
import { buildLocaleHref } from "@/i18n/locales";
import {
  getEffectiveInvitationLocales,
  supportsInvitationTranslations,
} from "@/lib/invitation-translations";
import type { InvitationData } from "@/lib/types";

export type InvitationSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type InvitationSearchParamsInput = InvitationSearchParams | string;

export function serializeInvitationSearchParams(
  searchParams: InvitationSearchParamsInput,
): string {
  if (typeof searchParams === "string") {
    return new URLSearchParams(searchParams).toString();
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params.toString();
}

export function getInvitationSearchParam(
  searchParams: InvitationSearchParams,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function buildInvitationLocaleSwitchHref(
  pathname: string,
  searchParams: InvitationSearchParamsInput,
  locale: AppLocale,
): string {
  const next = new URLSearchParams(
    serializeInvitationSearchParams(searchParams),
  );
  next.set("section", "hero");
  return buildLocaleHref(`${pathname}?${next.toString()}`, locale);
}

/**
 * URL for an in-place locale swap, used with `history.replaceState`.
 *
 * Identical to `buildInvitationLocaleSwitchHref` except it does not inject
 * `section=hero`. That flag exists to skip the envelope after a real
 * navigation; an in-place swap never unmounts the envelope, so forcing it
 * would put a stale param in the address bar for no reason.
 */
export function buildInvitationLocaleReplaceUrl(
  pathname: string,
  searchParams: InvitationSearchParamsInput,
  locale: AppLocale,
): string {
  const query = serializeInvitationSearchParams(searchParams);
  return buildLocaleHref(`${pathname}${query ? `?${query}` : ""}`, locale);
}

/** The subset of a mouse event that decides whether we hijack a locale link. */
export interface LocaleClickIntent {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

/**
 * Whether a click on a locale link should be swapped in place.
 *
 * The switcher stays an `<a href>` so it remains crawlable and works without
 * JavaScript. That means we must honour the browser's own intents —
 * Cmd/Ctrl/Shift/Alt click and middle click all mean "open elsewhere", and
 * hijacking them would be a bug.
 */
export function shouldInterceptLocaleClick(event: LocaleClickIntent): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

export function getInvitationLocaleRedirectPath(
  invitation: InvitationData,
  locale: AppLocale,
  pathname: string,
  searchParams: InvitationSearchParams,
): string | null {
  if (!supportsInvitationTranslations(invitation)) return null;
  if (getEffectiveInvitationLocales(invitation).includes(locale)) return null;

  const query = serializeInvitationSearchParams(searchParams);
  return buildLocaleHref(`${pathname}${query ? `?${query}` : ""}`, "pt");
}
