import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.saveTheDate.findMany({
    include: { theme: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, themeId, couple, date, customMessage } = body;

    if (!slug || !themeId || !couple || !date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, themeId, couple, date" },
        { status: 400 }
      );
    }

    const item = await prisma.saveTheDate.create({
      data: {
        slug,
        themeId,
        couple,
        date,
        customMessage: customMessage || null,
      },
      include: { theme: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
