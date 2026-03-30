import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// PUT    /api/admin/invitations/[id]/gift-categories/[catId] — Update category
// DELETE /api/admin/invitations/[id]/gift-categories/[catId] — Delete category
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const { catId } = await params;

  try {
    const body = await request.json();

    const category = await prisma.giftCategory.update({
      where: { id: catId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.order !== undefined && { order: body.order }),
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[Gift API] Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update gift category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const { catId } = await params;

  try {
    await prisma.giftCategory.delete({ where: { id: catId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Gift API] Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete gift category" },
      { status: 500 },
    );
  }
}
