import { NextResponse } from "next/server";

import { analyzePendingFont } from "@/lib/custom-fonts/admin-service";
import { customFontErrorResponse } from "@/lib/custom-fonts/http";
import {
  deletePendingFont,
  isPendingFontKey,
} from "@/lib/custom-fonts/storage";

async function pendingKeyFrom(request: Request): Promise<string | null> {
  const body = (await request.json()) as Record<string, unknown>;
  return typeof body.pendingKey === "string" ? body.pendingKey : null;
}

export async function POST(request: Request) {
  try {
    const pendingKey = await pendingKeyFrom(request);
    if (!isPendingFontKey(pendingKey)) {
      return NextResponse.json(
        { error: "Invalid pending font key", code: "invalid_pending_key" },
        { status: 400 },
      );
    }
    return NextResponse.json(await analyzePendingFont(pendingKey));
  } catch (error) {
    return customFontErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const pendingKey = await pendingKeyFrom(request);
    if (isPendingFontKey(pendingKey)) await deletePendingFont(pendingKey);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return customFontErrorResponse(error);
  }
}
