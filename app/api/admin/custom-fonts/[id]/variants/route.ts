import { NextResponse } from "next/server";

import { addCustomFontVariant } from "@/lib/custom-fonts/admin-service";
import { customFontErrorResponse } from "@/lib/custom-fonts/http";
import type { CustomFontStyle } from "@/lib/custom-fonts/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const family = await addCustomFontVariant((await context.params).id, {
      pendingKey: String(body.pendingKey ?? ""),
      originalFileName: String(body.originalFileName ?? ""),
      expectedChecksum: String(body.expectedChecksum ?? ""),
      weight: Number(body.weight),
      style: String(body.style ?? "") as CustomFontStyle,
      replace: body.replace === true,
    });
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return customFontErrorResponse(error);
  }
}
