import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { getRevisionForPreview, workspaceBundlePath } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stream a DRAFT revision's compiled bundle from the worker workspace for
 * preview. Published revisions are previewed directly from their immutable S3
 * URL (see lib/ai-preview.ts), so this path is draft-only.
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

  // Only the newest draft's bundle is the one currently in the workspace.
  const newest = await prisma.aiRevision.findFirst({
    where: { invitationId: revision.invitationId, bundleKey: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (newest?.id !== revision.id) return notFound();

  const code = await readFile(
    workspaceBundlePath(revision.invitationId),
    "utf8",
  ).catch(() => null);
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
