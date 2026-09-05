import { NextRequest, NextResponse } from "next/server";

import { activatePublishedRevision } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ revisionId: string }> },
) {
  const { revisionId } = await ctx.params;
  try {
    const result = await activatePublishedRevision(revisionId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Activate failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
