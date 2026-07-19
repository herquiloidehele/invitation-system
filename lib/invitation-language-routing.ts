import type { AppLocale } from "@/i18n/locales";
import { buildLocaleHref } from "@/i18n/locales";
import { getEffectiveInvitationLocales } from "@/lib/invitation-translations";
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

export function getInvitationLocaleRedirectPath(
  invitation: InvitationData,
  locale: AppLocale,
  pathname: string,
  searchParams: InvitationSearchParams,
): string | null {
  if (invitation.invitationType !== "standard") return null;
  if (getEffectiveInvitationLocales(invitation).includes(locale)) return null;

  const query = serializeInvitationSearchParams(searchParams);
  return buildLocaleHref(`${pathname}${query ? `?${query}` : ""}`, "pt");
}
