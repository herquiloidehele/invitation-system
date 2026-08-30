"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";

import { useGiftReservations } from "@/components/gifts/useGiftReservations";
import { useInvitationLocaleChange } from "@/components/shared/InvitationLanguageSwitcher";
import type { GiftAvailability } from "@/lib/gift-reservation-domain";
import { mergeGiftItems, pickLocaleValue } from "@/lib/ai-platform";
import type { GiftsApi, LocaleApi } from "@/lib/ai-platform-types";
import { usePlatformContext } from "./PlatformContext";

export { useRsvp } from "./useRsvp";
export { useCountdown } from "./useCountdown";
export { useCalendar } from "./useCalendar";
export { useEntryPass } from "./useEntryPass";

const FALLBACK_LOCALE = "pt";

/** `{ guest }` — the personalized guest resolved from the URL token, or null. */
export function useGuest(): {
  guest: ReturnType<typeof usePlatformContext>["guest"];
} {
  const { guest } = usePlatformContext();
  return { guest };
}

/** `{ locale, t, switchTo }` — active locale, a per-locale string picker, and
 *  an in-place language switch that drives InvitationLocaleController. */
export function useLocale(): LocaleApi {
  const locale = useNextIntlLocale();
  const localeChange = useInvitationLocaleChange();
  const t = useCallback(
    (map: Partial<Record<string, string>>) =>
      pickLocaleValue(map, locale, FALLBACK_LOCALE),
    [locale],
  );
  const switchTo = useCallback(
    (next: string) => {
      localeChange?.onLocaleChange(next as never);
    },
    [localeChange],
  );
  return { locale, t, switchTo };
}

/**
 * `useGifts()` — gift registry items annotated with live status, plus reserve /
 * release. Wraps the existing `useGiftReservations` hook and self-loads
 * availability on mount, so the host render path never has to pre-fetch it.
 */
export function useGifts(): GiftsApi {
  const { invitation, guest } = usePlatformContext();
  const slug = invitation.slug;
  const items = useMemo(
    () => invitation.giftRegistry?.items ?? [],
    [invitation.giftRegistry],
  );

  const reservations = useGiftReservations({
    slug,
    guestToken: guest?.token,
    initialAvailability: [] as GiftAvailability[],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void reservations
      .refresh()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // reservations.refresh is stable (useCallback in the underlying hook);
    // depend on slug so a different invitation reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const merged = useMemo(
    () => mergeGiftItems(items, reservations.availability),
    [items, reservations.availability],
  );

  return {
    items: merged,
    loading,
    pending: reservations.pending,
    error: reservations.error,
    reserve: reservations.choose,
    release: reservations.release,
    refresh: async () => {
      await reservations.refresh();
    },
  };
}
