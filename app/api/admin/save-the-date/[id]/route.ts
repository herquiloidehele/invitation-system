import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.saveTheDate.findUnique({
    where: { id },
    include: { theme: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { slug, themeId, couple, date, customMessage, envelope, textStyles, rsvp, audio, bottomHero } = body;
    const item = await prisma.saveTheDate.update({
      where: { id },
      data: {
        slug,
        themeId,
        couple,
        date,
        customMessage: customMessage || null,
        envelope: envelope || undefined,
        textStyles: textStyles || undefined,
        rsvp: rsvp || undefined,
        audio: audio || undefined,
        bottomHero: bottomHero || undefined,
      },
      include: { theme: true },
    });
    return NextResponse.json(item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.saveTheDateEvent.deleteMany({
      where: { saveTheDate: { id } },
    });
    await prisma.saveTheDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
