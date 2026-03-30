import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/themes/[id] — Get a single theme
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const theme = await prisma.theme.findUnique({ where: { id } });
    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }
    return NextResponse.json(theme);
  } catch (error) {
    console.error("[Themes API] Error fetching theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/themes/[id] — Update a theme
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check theme exists
    const existing = await prisma.theme.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    // If name is being changed, check it doesn't clash with another theme
    if (body.name && body.name !== existing.name) {
      const clash = await prisma.theme.findUnique({
        where: { name: body.name },
      });
      if (clash) {
        return NextResponse.json(
          { error: `Theme name "${body.name}" is already taken` },
          { status: 409 },
        );
      }
    }

    const theme = await prisma.theme.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        label: body.label ?? existing.label,
        description: body.description ?? existing.description,
        envelope: body.envelope ?? existing.envelope,
        bg: body.bg ?? existing.bg,
        cardBg: body.cardBg ?? existing.cardBg,
        cardBorder: body.cardBorder ?? existing.cardBorder,
        primary: body.primary ?? existing.primary,
        secondary: body.secondary ?? existing.secondary,
        accent: body.accent ?? existing.accent,
        textPrimary: body.textPrimary ?? existing.textPrimary,
        textSecondary: body.textSecondary ?? existing.textSecondary,
        textMuted: body.textMuted ?? existing.textMuted,
        displayFont: body.displayFont ?? existing.displayFont,
        bodyFont: body.bodyFont ?? existing.bodyFont,
        scriptFont:
          "scriptFont" in body
            ? (body.scriptFont ?? null)
            : existing.scriptFont,
        uiFont: body.uiFont ?? existing.uiFont,
        sectionTitleFont:
          "sectionTitleFont" in body
            ? (body.sectionTitleFont ?? null)
            : existing.sectionTitleFont,
        sectionTitleFontSize:
          "sectionTitleFontSize" in body
            ? (body.sectionTitleFontSize ?? null)
            : existing.sectionTitleFontSize,
        sectionTitleFontWeight:
          "sectionTitleFontWeight" in body
            ? (body.sectionTitleFontWeight ?? null)
            : existing.sectionTitleFontWeight,
        ctaPrimaryBg: body.ctaPrimaryBg ?? existing.ctaPrimaryBg,
        ctaPrimaryText: body.ctaPrimaryText ?? existing.ctaPrimaryText,
        ctaSecondaryBorder:
          body.ctaSecondaryBorder ?? existing.ctaSecondaryBorder,
        ctaSecondaryText: body.ctaSecondaryText ?? existing.ctaSecondaryText,
        ctaRadius: body.ctaRadius ?? existing.ctaRadius,
        monogramColor: body.monogramColor ?? existing.monogramColor,
        tapTextColor: body.tapTextColor ?? existing.tapTextColor,
        bgGradient:
          "bgGradient" in body
            ? (body.bgGradient ?? null)
            : existing.bgGradient,
        decorativeColor: body.decorativeColor ?? existing.decorativeColor,
        ctaGlow: "ctaGlow" in body ? (body.ctaGlow ?? null) : existing.ctaGlow,
      },
    });

    return NextResponse.json(theme);
  } catch (error) {
    console.error("[Themes API] Error updating theme:", error);
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/themes/[id] — Delete a theme
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check theme exists
    const existing = await prisma.theme.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    // Guard: cannot delete a theme that is in use by invitations
    const usageCount = await prisma.invitation.count({
      where: { themeId: id },
    });
    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete theme "${existing.label}" — it is used by ${usageCount} invitation${usageCount > 1 ? "s" : ""}. Reassign those invitations first.`,
        },
        { status: 409 },
      );
    }

    await prisma.theme.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Themes API] Error deleting theme:", error);
    return NextResponse.json(
      { error: "Failed to delete theme" },
      { status: 500 },
    );
  }
}
