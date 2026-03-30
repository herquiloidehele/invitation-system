import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// PUT    /api/admin/invitations/[id]/gift-items/[itemId] — Update item
// DELETE /api/admin/invitations/[id]/gift-items/[itemId] — Delete item
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { itemId } = await params;

  try {
    const body = await request.json();

    const item = await prisma.giftItem.update({
      where: { id: itemId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.imageUrl !== undefined && {
          imageUrl: body.imageUrl || null,
        }),
        ...(body.price !== undefined && {
          price: body.price != null ? parseFloat(body.price) : null,
        }),
        ...(body.link !== undefined && { link: body.link || null }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.categoryId !== undefined && {
          categoryId: body.categoryId,
        }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[Gift API] Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update gift item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { itemId } = await params;

  try {
    await prisma.giftItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Gift API] Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete gift item" },
      { status: 500 },
    );
  }
}
