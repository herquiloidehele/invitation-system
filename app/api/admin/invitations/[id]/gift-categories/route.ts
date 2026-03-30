import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET  /api/admin/invitations/[id]/gift-categories — List categories + items
// POST /api/admin/invitations/[id]/gift-categories — Create a category
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const categories = await prisma.giftCategory.findMany({
      where: { invitationId: id },
      orderBy: { order: "asc" },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[Gift API] Error listing categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift categories" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    // Get next order value
    const maxOrder = await prisma.giftCategory.aggregate({
      where: { invitationId: id },
      _max: { order: true },
    });

    const category = await prisma.giftCategory.create({
      data: {
        invitationId: id,
        name: body.name.trim(),
        icon: body.icon ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { items: true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[Gift API] Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create gift category" },
      { status: 500 },
    );
  }
}
