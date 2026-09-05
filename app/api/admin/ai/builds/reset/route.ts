import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getBuildStatus } from "@/lib/ai-build-registry";
import { resetInvitationAi } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Wipe every AI artifact for an invitation (messages, revisions, builds and
 * their S3 objects) so the builder can start from scratch. Auth is enforced
 * upstream by the proxy (valid JWT required for /api/admin/*).
 *
 * Refused while a build is running: the worker owns the workspace + writes
 * draft revisions, so it must be cancelled first.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  const slug = body?.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  if (getBuildStatus(slug).running) {
    return NextResponse.json(
      { error: "Há uma construção em curso. Cancele-a antes de recomeçar." },
      { status: 409 },
    );
  }
  const inv = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  const result = await resetInvitationAi(inv.id);
  return NextResponse.json(result);
}
