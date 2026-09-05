"use client";

import { useMemo } from "react";

import { buildEntryPassValue, readGuestPassToken } from "@/lib/entry-pass";
import type { EntryPassApi } from "@/lib/ai-secondary-types";
import { usePlatformContext } from "./PlatformContext";

/**
 * The QR payload for this guest's entry pass: the personal invite URL when a
 * guest token is present, else the stored non-personalized check-in pass URL,
 * else null. Computed during render — the AI path is client-only (ssr:false),
 * so `window` (origin + token store) is always available; the SSR guard is
 * belt-and-suspenders.
 */
export function useEntryPass(): EntryPassApi {
  const { invitation, guest } = usePlatformContext();

  return useMemo<EntryPassApi>(() => {
    if (typeof window === "undefined") {
      return { value: null, token: null, ready: false };
    }
    const checkInToken = readGuestPassToken(invitation.slug);
    const value = buildEntryPassValue({
      origin: window.location.origin,
      slug: invitation.slug,
      guestToken: guest?.token,
      guestName: guest?.name,
      checkInToken,
    });
    return {
      value,
      token: guest?.token ?? checkInToken ?? null,
      ready: true,
    };
  }, [invitation.slug, guest?.token, guest?.name]);
}
