"use client";

import { useCallback, useEffect, useState } from "react";

import {
  giftReservationStorageKey,
  type GiftAvailability,
} from "@/lib/gift-reservation-domain";

export type GiftReservationClientError = "conflict" | "request" | null;

type ReservationResponse = {
  availability: GiftAvailability[];
  managementToken?: string;
};

export function useGiftReservations({
  slug,
  guestToken,
  initialAvailability,
}: {
  slug: string;
  guestToken?: string;
  initialAvailability: GiftAvailability[];
}) {
  const [availability, setAvailability] =
    useState<GiftAvailability[]>(initialAvailability);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<GiftReservationClientError>(null);

  const requestHeaders = useCallback(() => {
    const headers = new Headers({ "content-type": "application/json" });
    if (guestToken) headers.set("x-guest-token", guestToken);
    const managementToken = window.localStorage.getItem(
      giftReservationStorageKey(slug),
    );
    if (managementToken) {
      headers.set("x-gift-reservation-token", managementToken);
    }
    return headers;
  }, [guestToken, slug]);

  const refresh = useCallback(async () => {
    const response = await fetch(
      `/api/invitations/${encodeURIComponent(slug)}/gift-reservations`,
      { headers: requestHeaders(), cache: "no-store" },
    );
    if (!response.ok) throw new Error("Failed to refresh gift availability");
    const data = (await response.json()) as ReservationResponse;
    setAvailability(data.availability);
    return data.availability;
  }, [requestHeaders, slug]);

  useEffect(() => {
    if (guestToken) return;
    if (!window.localStorage.getItem(giftReservationStorageKey(slug))) return;
    void refresh().catch(() => setError("request"));
  }, [guestToken, refresh, slug]);

  const choose = useCallback(
    async (giftItemId: string, guestName?: string): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/invitations/${encodeURIComponent(slug)}/gift-reservations`,
          {
            method: "POST",
            headers: requestHeaders(),
            body: JSON.stringify({ giftItemId, guestName }),
          },
        );
        if (response.status === 409) {
          await refresh();
          setError("conflict");
          return false;
        }
        if (!response.ok) {
          setError("request");
          return false;
        }
        const data = (await response.json()) as ReservationResponse;
        if (data.managementToken) {
          window.localStorage.setItem(
            giftReservationStorageKey(slug),
            data.managementToken,
          );
        }
        setAvailability(data.availability);
        return true;
      } catch {
        setError("request");
        return false;
      } finally {
        setPending(false);
      }
    },
    [refresh, requestHeaders, slug],
  );

  const release = useCallback(async (): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/invitations/${encodeURIComponent(slug)}/gift-reservations`,
        { method: "DELETE", headers: requestHeaders() },
      );
      if (!response.ok) {
        setError("request");
        return false;
      }
      const data = (await response.json()) as ReservationResponse;
      setAvailability(data.availability);
      if (!guestToken) {
        window.localStorage.removeItem(giftReservationStorageKey(slug));
      }
      return true;
    } catch {
      setError("request");
      return false;
    } finally {
      setPending(false);
    }
  }, [guestToken, requestHeaders, slug]);

  return { availability, pending, error, choose, release, refresh };
}
