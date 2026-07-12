import { NextRequest, NextResponse } from "next/server";

import {
  giftReservationErrorStatus,
  GiftReservationError,
  listOwnerGiftReservations,
} from "@/lib/gift-reservations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const reservations = await listOwnerGiftReservations(token);
    return NextResponse.json({ reservations });
  } catch (error) {
    if (error instanceof GiftReservationError) {
      return NextResponse.json(
        { error: error.message },
        { status: giftReservationErrorStatus(error.code) },
      );
    }
    console.error("[Owner Gift Reservations API] Unexpected error", error);
    return NextResponse.json(
      { error: "Failed to load gift reservations" },
      { status: 500 },
    );
  }
}
