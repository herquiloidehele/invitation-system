import { NextRequest, NextResponse } from "next/server";

import { publishExistingRevision } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ revisionId: string }> },
) {
  const { revisionId } = await ctx.params;
  try {
    const result = await publishExistingRevision(revisionId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
