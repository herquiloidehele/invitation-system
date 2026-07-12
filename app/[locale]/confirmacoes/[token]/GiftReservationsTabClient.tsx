"use client";

import { useEffect, useState } from "react";
import { Gift, Link2, Trash2, UserRound } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getDateFormatLocale, type AppLocale } from "@/i18n/locales";
import type { GiftReservationOwnerRow } from "@/lib/gift-reservation-domain";

type Labels = {
  title: string;
  empty: string;
  personalized: string;
  publicLink: string;
  removed: string;
  release: string;
  releaseTitle: string;
  releaseDescription: string;
  cancel: string;
  error: string;
};

export default function GiftReservationsTabClient({
  ownerToken,
  locale,
  labels,
}: {
  ownerToken: string;
  locale: AppLocale;
  labels: Labels;
}) {
  const [reservations, setReservations] = useState<
    GiftReservationOwnerRow[] | null
  >(null);
  const [error, setError] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/owner/${encodeURIComponent(ownerToken)}/gift-reservations`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load reservations");
        const data = (await response.json()) as {
          reservations: GiftReservationOwnerRow[];
        };
        if (!cancelled) setReservations(data.reservations);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerToken]);

  async function release(reservationId: string) {
    setReleasingId(reservationId);
    setError(false);
    try {
      const response = await fetch(
        `/api/owner/${encodeURIComponent(ownerToken)}/gift-reservations/${encodeURIComponent(reservationId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to release reservation");
      setReservations(
        (current) => current?.filter((row) => row.id !== reservationId) ?? [],
      );
    } catch {
      setError(true);
    } finally {
      setReleasingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="size-5 text-stone-400" />
        <h2 className="text-lg font-semibold text-stone-800">{labels.title}</h2>
      </div>

      {error && (
        <p
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {labels.error}
        </p>
      )}

      {reservations === null ? (
        <div className="h-28 animate-pulse rounded-xl border bg-white" />
      ) : reservations.length === 0 ? (
        <div className="rounded-xl border bg-white px-6 py-12 text-center text-sm text-stone-500">
          {labels.empty}
        </div>
      ) : (
        <ul className="space-y-3">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="font-medium text-stone-800">
                    {reservation.giftName}
                  </p>
                  {reservation.removedFromGiftList && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      {labels.removed}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600">
                    <UserRound className="size-3.5 text-stone-400" />
                    {reservation.guestName}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-400">
                    <Link2 className="size-3.5" />
                    {reservation.source === "personalized"
                      ? labels.personalized
                      : labels.publicLink}
                    <span aria-hidden="true">·</span>
                    <time dateTime={reservation.reservedAt}>
                      {new Date(reservation.reservedAt).toLocaleString(
                        getDateFormatLocale(locale),
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </time>
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={releasingId === reservation.id}
                        className="shrink-0 text-red-700 hover:text-red-800"
                      />
                    }
                  >
                    <Trash2 className="size-3.5" />
                    {labels.release}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{labels.releaseTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {labels.releaseDescription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void release(reservation.id)}
                      >
                        {labels.release}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
