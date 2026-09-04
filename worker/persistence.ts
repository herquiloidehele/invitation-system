import { readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { buildBundleObjectKey } from "@/lib/ai-bundle";
import { publicUrlForKey, putObjectBuffer } from "@/lib/s3";
import type { BuildUsage } from "./lib/build-events";

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

/** The newest unpublished revision — the one whose bundle is in the workspace. */
export async function latestDraftRevisionId(
  invitationId: string,
): Promise<string | null> {
  const rev = await prisma.aiRevision.findFirst({
    where: { invitationId, bundleKey: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return rev?.id ?? null;
}

/** Replace a draft's stored source without creating a new revision. */
export async function updateDraftRevisionSource(
  revisionId: string,
  sourceFiles: Record<string, string>,
): Promise<void> {
  await prisma.aiRevision.update({
    where: { id: revisionId },
    data: { sourceFiles },
  });
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
  /** Token accounting for the agent turn that produced this message. */
  usage?: BuildUsage | null;
  /** Visual critique payload, when this turn is a review. */
  critique?: unknown;
}): Promise<string> {
  const created = await prisma.aiMessage.create({
    data: {
      buildId: args.buildId,
      role: args.role,
      content: args.content,
      revisionId: args.revisionId ?? null,
      costUsd: args.costUsd ?? null,
      directions: (args.directions ?? undefined) as never,
      usage: (args.usage ?? undefined) as never,
      critique: (args.critique ?? undefined) as never,
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Attach every not-yet-sent upload to the message being sent. "Pending" is
 * simply `messageId === null`, which is exactly the composer's tray — so
 * sending is what turns a tray item into part of the conversation.
 */
export async function linkPendingAttachments(
  buildId: string,
  messageId: string,
): Promise<void> {
  await prisma.aiAttachment.updateMany({
    where: { buildId, messageId: null },
    data: { messageId },
  });
}

/** Uploads not yet sent with a message — what the composer tray shows. */
export async function listPendingAttachments(
  invitationId: string,
): Promise<AttachmentRecord[]> {
  return prisma.aiAttachment.findMany({
    where: { invitationId, messageId: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      kind: true,
      mimeType: true,
      objectKey: true,
      url: true,
      width: true,
      height: true,
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
    usage: unknown;
    critique: unknown;
    attachments: AttachmentRecord[];
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
      usage: true,
      critique: true,
      createdAt: true,
      attachments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          kind: true,
          mimeType: true,
          objectKey: true,
          url: true,
          width: true,
          height: true,
        },
      },
    },
  });
}

/**
 * A file the admin uploaded in the builder chat. Client components may import
 * this type, but must do so with `import type` so Prisma never reaches the
 * browser bundle.
 */
export type AttachmentRecord = {
  id: string;
  name: string;
  kind: string;
  mimeType: string;
  objectKey: string;
  url: string;
  width: number | null;
  height: number | null;
};

/** Register a file that has already been uploaded to S3. */
export async function recordAttachment(args: {
  buildId: string;
  invitationId: string;
  messageId?: string | null;
  name: string;
  kind: "image" | "pdf";
  mimeType: string;
  objectKey: string;
  url: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
}): Promise<AttachmentRecord> {
  return prisma.aiAttachment.create({
    data: {
      buildId: args.buildId,
      invitationId: args.invitationId,
      messageId: args.messageId ?? null,
      name: args.name,
      kind: args.kind,
      mimeType: args.mimeType,
      objectKey: args.objectKey,
      url: args.url,
      sizeBytes: args.sizeBytes,
      width: args.width ?? null,
      height: args.height ?? null,
    },
    select: {
      id: true,
      name: true,
      kind: true,
      mimeType: true,
      objectKey: true,
      url: true,
      width: true,
      height: true,
    },
  });
}

/** Every attachment for an invitation, oldest first. */
export async function listAttachmentsForInvitation(
  invitationId: string,
): Promise<AttachmentRecord[]> {
  return prisma.aiAttachment.findMany({
    where: { invitationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      kind: true,
      mimeType: true,
      objectKey: true,
      url: true,
      width: true,
      height: true,
    },
  });
}

/** Remove an attachment (does not delete the S3 object). */
export async function deleteAttachment(id: string): Promise<void> {
  await prisma.aiAttachment.delete({ where: { id } });
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
