import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/admin/invitations/[id]/gift-items — Create a gift item
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 },
      );
    }

    if (!body.categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 },
      );
    }

    // Verify category belongs to this invitation
    const category = await prisma.giftCategory.findFirst({
      where: { id: body.categoryId, invitationId: id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found for this invitation" },
        { status: 404 },
      );
    }

    // Get next order value within the category
    const maxOrder = await prisma.giftItem.aggregate({
      where: { categoryId: body.categoryId },
      _max: { order: true },
    });

    const item = await prisma.giftItem.create({
      data: {
        categoryId: body.categoryId,
        name: body.name.trim(),
        imageUrl: body.imageUrl ?? null,
        price: body.price != null ? parseFloat(body.price) : null,
        link: body.link ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[Gift API] Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create gift item" },
      { status: 500 },
    );
  }
}
