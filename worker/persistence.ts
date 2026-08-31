import { readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { buildBundleObjectKey } from "@/lib/ai-bundle";
import { publicUrlForKey, putObjectBuffer } from "@/lib/s3";

/** On-disk workspace for an invitation's builds (shared fs with the app). */
export function workspaceBundlePath(invitationId: string): string {
  return path.join(
    process.cwd(),
    ".ai-workspaces",
    `inv-${invitationId}`,
    "dist",
    "bundle.js",
  );
}

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
 * Persist a successful build as a DRAFT revision: store the source only. No S3
 * write, no `publishedAt`, and the invitation is left untouched. The compiled
 * bundle stays in the workspace (`workspaceBundlePath`) for preview + publish.
 */
export async function createDraftRevision(args: {
  buildId: string;
  invitationId: string;
  prompt: string;
  sourceFiles: Record<string, string>;
}): Promise<{ revisionId: string }> {
  const revision = await prisma.aiRevision.create({
    data: {
      buildId: args.buildId,
      invitationId: args.invitationId,
      prompt: args.prompt,
      sourceFiles: args.sourceFiles,
    },
  });
  await prisma.aiBuild.update({
    where: { id: args.buildId },
    data: { status: "ready" },
  });
  return { revisionId: revision.id };
}

/**
 * Publish a draft revision: upload its workspace bundle to S3, stamp
 * bundleKey/publishedAt, and repoint the invitation (renderMode='ai'). Only the
 * latest draft is publishable — its bundle is the one currently in the
 * workspace. Older drafts must be rebuilt first.
 */
export async function publishExistingRevision(
  revisionId: string,
): Promise<{ bundleUrl: string; activeRevisionId: string }> {
  const revision = await prisma.aiRevision.findUnique({
    where: { id: revisionId },
  });
  if (!revision) throw new Error("Revision not found.");
  if (revision.bundleKey) {
    // Already published: republishing = just re-activate it.
    await prisma.invitation.update({
      where: { id: revision.invitationId },
      data: { renderMode: "ai", activeRevisionId: revision.id },
    });
    return {
      bundleUrl: publicUrlForKey(revision.bundleKey),
      activeRevisionId: revision.id,
    };
  }

  const newest = await prisma.aiRevision.findFirst({
    where: { invitationId: revision.invitationId, bundleKey: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (newest?.id !== revision.id) {
    throw new Error(
      "Only the latest draft can be published; rebuild this revision first.",
    );
  }

  const bundleCode = await readFile(
    workspaceBundlePath(revision.invitationId),
    "utf8",
  ).catch(() => "");
  if (!bundleCode) {
    throw new Error("Draft bundle missing from workspace; rebuild to publish.");
  }

  const key = buildBundleObjectKey(revision.invitationId, revision.id);
  await putObjectBuffer(
    key,
    Buffer.from(bundleCode, "utf8"),
    "application/javascript",
  );
  await prisma.aiRevision.update({
    where: { id: revision.id },
    data: { bundleKey: key, publishedAt: new Date() },
  });
  await prisma.invitation.update({
    where: { id: revision.invitationId },
    data: { renderMode: "ai", activeRevisionId: revision.id },
  });
  return { bundleUrl: publicUrlForKey(key), activeRevisionId: revision.id };
}

/** Roll back / forward: point the invitation at an already-published revision. */
export async function activatePublishedRevision(
  revisionId: string,
): Promise<{ activeRevisionId: string }> {
  const revision = await prisma.aiRevision.findUnique({
    where: { id: revisionId },
    select: { id: true, invitationId: true, bundleKey: true },
  });
  if (!revision) throw new Error("Revision not found.");
  if (!revision.bundleKey) {
    throw new Error("Cannot activate an unpublished draft — publish it first.");
  }
  await prisma.invitation.update({
    where: { id: revision.invitationId },
    data: { renderMode: "ai", activeRevisionId: revision.id },
  });
  return { activeRevisionId: revision.id };
}

/** Append one chat turn to a build's durable thread. */
export async function appendMessage(args: {
  buildId: string;
  role: "user" | "assistant";
  content: string;
  revisionId?: string | null;
  costUsd?: number | null;
  /** Proposed directions, when this turn is a directions gate. */
  directions?: unknown;
}): Promise<void> {
  await prisma.aiMessage.create({
    data: {
      buildId: args.buildId,
      role: args.role,
      content: args.content,
      revisionId: args.revisionId ?? null,
      costUsd: args.costUsd ?? null,
      directions: (args.directions ?? undefined) as never,
    },
  });
}

/** How many revisions exist for an invitation — 0 means no design exists yet. */
export async function revisionCount(invitationId: string): Promise<number> {
  return prisma.aiRevision.count({ where: { invitationId } });
}

/** The full conversation for an invitation's build, oldest first. */
export async function listMessagesForInvitation(invitationId: string): Promise<
  Array<{
    id: string;
    role: string;
    content: string;
    revisionId: string | null;
    costUsd: number | null;
    directions: unknown;
    createdAt: Date;
  }>
> {
  const build = await prisma.aiBuild.findFirst({
    where: { invitationId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!build) return [];
  return prisma.aiMessage.findMany({
    where: { buildId: build.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      revisionId: true,
      costUsd: true,
      directions: true,
      createdAt: true,
    },
  });
}

/** A revision resolved for preview: its invitation + whether it is published. */
export async function getRevisionForPreview(revisionId: string): Promise<{
  id: string;
  invitationId: string;
  bundleKey: string | null;
} | null> {
  return prisma.aiRevision.findUnique({
    where: { id: revisionId },
    select: { id: true, invitationId: true, bundleKey: true },
  });
}

/** All revisions for an invitation, newest first, shaped for the admin rail. */
export async function listRevisionsForInvitation(invitationId: string): Promise<
  Array<{
    id: string;
    prompt: string | null;
    label: string | null;
    createdAt: Date;
    published: boolean;
    active: boolean;
  }>
> {
  const [rows, inv] = await Promise.all([
    prisma.aiRevision.findMany({
      where: { invitationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        prompt: true,
        label: true,
        createdAt: true,
        bundleKey: true,
      },
    }),
    prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { activeRevisionId: true },
    }),
  ]);
  return rows.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    label: r.label,
    createdAt: r.createdAt,
    published: r.bundleKey !== null,
    active: inv?.activeRevisionId === r.id,
  }));
}
