import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/models — List all models
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const models = await prisma.model.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(models);
  } catch (error) {
    console.error("[Models API] Error listing models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/models — Create a new model
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Required fields
    const required = ["name", "label", "description", "component"] as const;

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Check name uniqueness
    const existing = await prisma.model.findUnique({
      where: { name: body.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Model name "${body.name}" already exists` },
        { status: 409 },
      );
    }

    const model = await prisma.model.create({
      data: {
        name: body.name,
        label: body.label,
        description: body.description,
        component: body.component,
        previewImage: body.previewImage || null,
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("[Models API] Error creating model:", error);
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 },
    );
  }
}
