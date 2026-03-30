import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/themes — List all themes
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(themes);
  } catch (error) {
    console.error("[Themes API] Error listing themes:", error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/themes — Create a new theme
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Required fields
    const required = [
      "name",
      "label",
      "description",
      "envelope",
      "bg",
      "cardBg",
      "cardBorder",
      "primary",
      "secondary",
      "accent",
      "textPrimary",
      "textSecondary",
      "textMuted",
      "displayFont",
      "bodyFont",
      "uiFont",
      "ctaPrimaryBg",
      "ctaPrimaryText",
      "ctaSecondaryBorder",
      "ctaSecondaryText",
      "ctaRadius",
      "monogramColor",
      "tapTextColor",
      "decorativeColor",
    ] as const;

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Check name uniqueness
    const existing = await prisma.theme.findUnique({
      where: { name: body.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Theme name "${body.name}" already exists` },
        { status: 409 },
      );
    }

    const theme = await prisma.theme.create({
      data: {
        name: body.name,
        label: body.label,
        description: body.description,
        envelope: body.envelope,
        bg: body.bg,
        cardBg: body.cardBg,
        cardBorder: body.cardBorder,
        primary: body.primary,
        secondary: body.secondary,
        accent: body.accent,
        textPrimary: body.textPrimary,
        textSecondary: body.textSecondary,
        textMuted: body.textMuted,
        displayFont: body.displayFont,
        bodyFont: body.bodyFont,
        scriptFont: body.scriptFont ?? null,
        uiFont: body.uiFont,
        sectionTitleFont: body.sectionTitleFont ?? null,
        sectionTitleFontSize: body.sectionTitleFontSize ?? null,
        sectionTitleFontWeight: body.sectionTitleFontWeight ?? null,
        ctaPrimaryBg: body.ctaPrimaryBg,
        ctaPrimaryText: body.ctaPrimaryText,
        ctaSecondaryBorder: body.ctaSecondaryBorder,
        ctaSecondaryText: body.ctaSecondaryText,
        ctaRadius: body.ctaRadius,
        monogramColor: body.monogramColor,
        tapTextColor: body.tapTextColor,
        bgGradient: body.bgGradient ?? null,
        decorativeColor: body.decorativeColor,
        ctaGlow: body.ctaGlow ?? null,
      },
    });

    return NextResponse.json(theme, { status: 201 });
  } catch (error) {
    console.error("[Themes API] Error creating theme:", error);
    return NextResponse.json(
      { error: "Failed to create theme" },
      { status: 500 },
    );
  }
}
