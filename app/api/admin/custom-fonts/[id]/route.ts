import { NextResponse } from "next/server";

import {
  deleteCustomFontFamily,
  getCustomFontFamily,
  updateCustomFontFamily,
} from "@/lib/custom-fonts/admin-service";
import { customFontErrorResponse } from "@/lib/custom-fonts/http";
import type { FontCategory } from "@/lib/custom-fonts/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    return NextResponse.json(
      await getCustomFontFamily((await context.params).id),
    );
  } catch (error) {
    return customFontErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = {
      ...(typeof body.name === "string" ? { name: body.name } : {}),
      ...(typeof body.fallbackCategory === "string"
        ? { fallbackCategory: body.fallbackCategory as FontCategory }
        : {}),
      ...(typeof body.archived === "boolean" ? { archived: body.archived } : {}),
    };
    return NextResponse.json(
      await updateCustomFontFamily((await context.params).id, input),
    );
  } catch (error) {
    return customFontErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await deleteCustomFontFamily((await context.params).id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return customFontErrorResponse(error);
  }
}
