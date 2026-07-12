import { NextRequest, NextResponse } from "next/server";

import {
  giftReservationErrorStatus,
  GiftReservationError,
  releaseOwnerGiftReservation,
} from "@/lib/gift-reservations";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; reservationId: string }> },
) {
  const { token, reservationId } = await params;
  try {
    await releaseOwnerGiftReservation(token, reservationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof GiftReservationError) {
      return NextResponse.json(
        { error: error.message },
        { status: giftReservationErrorStatus(error.code) },
      );
    }
    console.error("[Owner Gift Reservations API] Unexpected error", error);
    return NextResponse.json(
      { error: "Failed to release gift reservation" },
      { status: 500 },
    );
  }
}
