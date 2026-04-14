import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/models/[id] — Get a single model
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const model = await prisma.model.findUnique({ where: { id } });
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    return NextResponse.json(model);
  } catch (error) {
    console.error("[Models API] Error fetching model:", error);
    return NextResponse.json(
      { error: "Failed to fetch model" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/models/[id] — Update a model
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check model exists
    const existing = await prisma.model.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // If name is being changed, check it doesn't clash with another model
    if (body.name && body.name !== existing.name) {
      const clash = await prisma.model.findUnique({
        where: { name: body.name },
      });
      if (clash) {
        return NextResponse.json(
          { error: `Model name "${body.name}" is already taken` },
          { status: 409 },
        );
      }
    }

    const model = await prisma.model.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        label: body.label ?? existing.label,
        description: body.description ?? existing.description,
        component: body.component ?? existing.component,
        previewImage: body.previewImage ?? existing.previewImage,
      },
    });

    return NextResponse.json(model);
  } catch (error) {
    console.error("[Models API] Error updating model:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/models/[id] — Delete a model
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check model exists
    const existing = await prisma.model.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Guard: cannot delete a model that is in use by invitations
    const usageCount = await prisma.invitation.count({
      where: { modelId: id },
    });
    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete model "${existing.label}" — it is used by ${usageCount} invitation${usageCount > 1 ? "s" : ""}. Reassign those invitations first.`,
        },
        { status: 409 },
      );
    }

    await prisma.model.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Models API] Error deleting model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 },
    );
  }
}
