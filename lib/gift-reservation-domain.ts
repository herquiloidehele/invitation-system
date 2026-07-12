import type { GiftItem } from "@/lib/types";

export type GiftAvailabilityStatus = "available" | "reserved" | "owned";

export type GiftAvailability = {
  giftItemId: string;
  status: GiftAvailabilityStatus;
};

export type GiftReservationRow = {
  id: string;
  giftItemId: string;
  guestName: string;
};

export type GiftReservationOwnerRow = GiftReservationRow & {
  giftName: string;
  source: "personalized" | "public";
  reservedAt: string;
  removedFromGiftList: boolean;
};

export function normalizePublicGuestName(value: unknown): string {
  const name =
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!name) throw new Error("Guest name is required");
  if (name.length > 120) throw new Error("Guest name is too long");
  return name;
}

export function projectGiftAvailability(
  items: Pick<GiftItem, "id">[],
  reservations: GiftReservationRow[],
  ownedReservationId: string | null,
): GiftAvailability[] {
  const byGift = new Map(
    reservations.map((reservation) => [
      reservation.giftItemId,
      reservation,
    ]),
  );

  return items.map((item) => {
    const reservation = byGift.get(item.id);
    return {
      giftItemId: item.id,
      status: !reservation
        ? "available"
        : reservation.id === ownedReservationId
          ? "owned"
          : "reserved",
    };
  });
}

export function giftReservationStorageKey(slug: string): string {
  return `gift-reservation:${slug}`;
}

export function resolveGiftCardState(
  availability?: GiftAvailability,
): GiftAvailabilityStatus | "loading" {
  return availability?.status ?? "loading";
}
