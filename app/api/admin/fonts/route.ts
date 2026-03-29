import { NextRequest, NextResponse } from "next/server";
import { searchGoogleFonts, type FontCategory } from "@/lib/google-fonts";

const VALID_CATEGORIES: FontCategory[] = [
  "serif",
  "sans-serif",
  "display",
  "handwriting",
  "monospace",
];

/**
 * GET /api/admin/fonts?search=cormo&category=serif&page=1&limit=50
 *
 * Returns a paginated, searchable list of Google Fonts.
 * Results are sorted with builtin (optimized) fonts first, then by popularity.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const search = searchParams.get("search") ?? undefined;
    const categoryRaw = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );

    let category: FontCategory | undefined;
    if (categoryRaw && VALID_CATEGORIES.includes(categoryRaw as FontCategory)) {
      category = categoryRaw as FontCategory;
    }

    const result = await searchGoogleFonts({ search, category, page, limit });

    return NextResponse.json(result, {
      headers: {
        // Cache for 1 hour on CDN / client
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[fonts API]", error);
    return NextResponse.json(
      { error: "Failed to fetch fonts" },
      { status: 500 },
    );
  }
}
