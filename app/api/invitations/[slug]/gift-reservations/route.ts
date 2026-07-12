import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  chooseGift,
  getGiftAvailability,
  giftReservationErrorStatus,
  GiftReservationError,
  releaseGuestGift,
} from "@/lib/gift-reservations";

const chooseSchema = z
  .object({
    giftItemId: z.string().min(1).max(200),
    guestName: z.string().optional(),
  })
  .strict();

function identityHeaders(request: NextRequest) {
  return {
    guestToken: request.headers.get("x-guest-token") ?? undefined,
    managementToken:
      request.headers.get("x-gift-reservation-token") ?? undefined,
  };
}

function errorResponse(error: unknown) {
  if (error instanceof GiftReservationError) {
    return NextResponse.json(
      { error: error.message },
      { status: giftReservationErrorStatus(error.code) },
    );
  }
  console.error("[Gift Reservations API] Unexpected error", error);
  return NextResponse.json(
    { error: "Failed to update gift reservation" },
    { status: 500 },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const availability = await getGiftAvailability({
      slug,
      ...identityHeaders(request),
    });
    return NextResponse.json({ availability });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = chooseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid gift reservation request" },
      { status: 400 },
    );
  }

  try {
    const result = await chooseGift({
      slug,
      ...parsed.data,
      ...identityHeaders(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const result = await releaseGuestGift({
      slug,
      ...identityHeaders(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
