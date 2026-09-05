import { NextRequest } from "next/server";

import { getRevisionForPreview } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stream a DRAFT revision's compiled bundle for preview. The bundle is stored
 * on the revision row (`bundleCode`), so this survives the ephemeral filesystem
 * and any draft is previewable — not just the newest one in the workspace.
 * Published revisions are previewed from their immutable S3 URL (see
 * lib/ai-preview.ts), so this path is draft-only.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ revisionId: string }> },
) {
  const { revisionId } = await ctx.params;
  const revision = await getRevisionForPreview(revisionId);
  if (!revision) return notFound();
  if (revision.bundleKey) {
    // Published — should be loaded from S3, not here.
    return notFound();
  }
  const code = revision.bundleCode;
  if (!code) return notFound();

  return new Response(code, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function notFound() {
  return new Response("Not found", { status: 404 });
}
