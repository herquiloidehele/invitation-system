import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

const schema = z.object({
  slug: z.string().min(1),
  type: z.enum([
    "page_view",
    "envelope_open",
    "maps_click",
    "waze_click",
    "gift_click",
    "audio_play",
    "calendar_click",
    "rsvp_submit",
  ]),
  visitorId: z.string().min(1),
  sessionId: z.string().min(1),
  device: z.enum(["mobile", "tablet", "desktop"]).optional(),
  referrer: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { slug, type, visitorId, sessionId, device, referrer } = result.data;

    // Deduplicate page_view: skip if same session already has one in the last 30 min
    if (type === "page_view") {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000);
      const existing = await prisma.invitationEvent.findFirst({
        where: {
          invitationSlug: slug,
          type: "page_view",
          sessionId,
          createdAt: { gte: cutoff },
        },
        select: { id: true },
      });
      if (existing) {
        return new NextResponse(null, { status: 204 });
      }
    }

    // Verify invitation exists (skip write silently if not found — avoids errors on stale slugs)
    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (!invitation) {
      return new NextResponse(null, { status: 204 });
    }

    await prisma.invitationEvent.create({
      data: {
        invitationSlug: slug,
        type,
        visitorId,
        sessionId,
        device: device ?? null,
        referrer: referrer ?? null,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    // Never surface errors — analytics should never break the user's page
    return new NextResponse(null, { status: 204 });
  }
}
