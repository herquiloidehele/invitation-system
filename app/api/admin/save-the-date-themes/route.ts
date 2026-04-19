import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const themes = await prisma.saveTheDateTheme.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(themes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const theme = await prisma.saveTheDateTheme.create({ data: body });
    return NextResponse.json(theme, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
