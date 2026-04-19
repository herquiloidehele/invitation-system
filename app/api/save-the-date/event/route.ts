import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, type } = body;

    if (!slug || !type) {
      return NextResponse.json({ error: "Missing slug or type" }, { status: 400 });
    }

    // Verify save-the-date exists
    const std = await prisma.saveTheDate.findUnique({ where: { slug } });
    if (!std) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.saveTheDateEvent.create({
      data: {
        slug,
        type,
        visitorId: body.visitorId || "anonymous",
        sessionId: body.sessionId || crypto.randomUUID(),
        device: req.headers.get("user-agent") || undefined,
        referrer: req.headers.get("referer") || undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
