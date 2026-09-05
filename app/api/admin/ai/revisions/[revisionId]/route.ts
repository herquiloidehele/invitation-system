import { NextRequest, NextResponse } from "next/server";

import { deleteRevision } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Remove a revision. The active one is refused (400). */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ revisionId: string }> },
) {
  const { revisionId } = await ctx.params;
  try {
    const result = await deleteRevision(revisionId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    const status = message === "Revision not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
