import { NextResponse } from "next/server";

import {
  createCustomFontFamily,
  listCustomFontFamilies,
} from "@/lib/custom-fonts/admin-service";
import { customFontErrorResponse } from "@/lib/custom-fonts/http";
import type {
  CustomFontStyle,
  FontCategory,
} from "@/lib/custom-fonts/types";

function integerParam(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const archivedValue = params.get("archived");
    const archived =
      archivedValue === "archived" || archivedValue === "all"
        ? archivedValue
        : "active";
    return NextResponse.json(
      await listCustomFontFamilies({
        search: params.get("search") ?? undefined,
        archived,
        page: integerParam(params.get("page"), 1),
        limit: integerParam(params.get("limit"), 50),
      }),
    );
  } catch (error) {
    return customFontErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const family = await createCustomFontFamily({
      name: String(body.name ?? ""),
      fallbackCategory: String(body.fallbackCategory ?? "") as FontCategory,
      pendingKey: String(body.pendingKey ?? ""),
      originalFileName: String(body.originalFileName ?? ""),
      expectedChecksum: String(body.expectedChecksum ?? ""),
      weight: Number(body.weight),
      style: String(body.style ?? "") as CustomFontStyle,
      replace: false,
    });
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return customFontErrorResponse(error);
  }
}
