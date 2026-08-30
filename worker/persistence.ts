import { prisma } from "@/lib/db";
import { buildBundleObjectKey } from "@/lib/ai-bundle";
import { publicUrlForKey, putObjectBuffer } from "@/lib/s3";

/** The build for an invitation (one per invitation), creating it if absent. */
export async function getOrCreateBuild(invitationId: string) {
  const existing = await prisma.aiBuild.findFirst({
    where: { invitationId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return prisma.aiBuild.create({ data: { invitationId, status: "draft" } });
}

/** The most recent revision's source tree, for workspace hydration + resume. */
export async function latestRevisionSource(
  buildId: string,
): Promise<Record<string, string> | null> {
  const rev = await prisma.aiRevision.findFirst({
    where: { buildId },
    orderBy: { createdAt: "desc" },
    select: { sourceFiles: true },
  });
  return (rev?.sourceFiles as Record<string, string> | undefined) ?? null;
}

export async function saveSessionId(buildId: string, sessionId: string) {
  await prisma.aiBuild.update({
    where: { id: buildId },
    data: { agentSessionId: sessionId, status: "building" },
  });
}

/**
 * Persist a successful build as a published revision: store the source, upload
 * the bundle to S3, and repoint the invitation at it (renderMode='ai').
 */
export async function publishRevision(args: {
  buildId: string;
  invitationId: string;
  prompt: string;
  sourceFiles: Record<string, string>;
  bundleCode: string;
}): Promise<{ revisionId: string; bundleUrl: string }> {
  const revision = await prisma.aiRevision.create({
    data: {
      buildId: args.buildId,
      invitationId: args.invitationId,
      prompt: args.prompt,
      sourceFiles: args.sourceFiles,
    },
  });

  const key = buildBundleObjectKey(args.invitationId, revision.id);
  await putObjectBuffer(
    key,
    Buffer.from(args.bundleCode, "utf8"),
    "application/javascript",
  );

  await prisma.aiRevision.update({
    where: { id: revision.id },
    data: { bundleKey: key, publishedAt: new Date() },
  });

  await prisma.aiBuild.update({
    where: { id: args.buildId },
    data: { status: "ready" },
  });

  await prisma.invitation.update({
    where: { id: args.invitationId },
    data: { renderMode: "ai", activeRevisionId: revision.id },
  });

  return { revisionId: revision.id, bundleUrl: publicUrlForKey(key) };
}
