import { readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { buildBundleObjectKey } from "@/lib/ai-bundle";
import { deleteObject, publicUrlForKey, putObjectBuffer } from "@/lib/s3";
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
  bundleCode: string;
}): Promise<{ revisionId: string }> {
  const revision = await prisma.aiRevision.create({
    data: {
      buildId: args.buildId,
      invitationId: args.invitationId,
      prompt: args.prompt,
      sourceFiles: args.sourceFiles,
      bundleCode: args.bundleCode,
    },
  });
  await prisma.aiBuild.update({
    where: { id: args.buildId },
    data: { status: "ready" },
  });
  return { revisionId: revision.id };
}

/**
 * Publish a draft revision: upload its stored bundle to S3, stamp
 * bundleKey/publishedAt, and repoint the invitation (renderMode='ai'). The
 * bundle comes from the revision row, so any draft is publishable and the
 * workspace disk is not consulted.
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

  // The bundle is stored on the row (survives the ephemeral filesystem), so any
  // draft publishes deterministically — no "newest only" workspace dependency.
  const bundleCode = revision.bundleCode ?? "";
  if (!bundleCode) {
    throw new Error(
      "Este rascunho não tem bundle guardado; reconstrua antes de publicar.",
    );
  }

  const key = buildBundleObjectKey(revision.invitationId, revision.id);
  await putObjectBuffer(
    key,
    Buffer.from(bundleCode, "utf8"),
    "application/javascript",
  );
  await prisma.aiRevision.update({
    where: { id: revision.id },
    // Clear the DB copy: the bundle now lives in S3 (bundleKey), so the row's
    // bytes are redundant. Drafts keep bundleCode; published revisions don't —
    // that bounds Postgres growth to the drafts currently being worked on.
    data: { bundleKey: key, publishedAt: new Date(), bundleCode: null },
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
  bundleCode: string,
): Promise<void> {
  await prisma.aiRevision.update({
    where: { id: revisionId },
    data: { sourceFiles, bundleCode },
  });
}

/**
 * Remove one revision. The active (live) one is protected; a published but
 * inactive one also loses its S3 bundle. If it was the newest revision of its
 * build, the agent session is dropped: the resumed agent would otherwise
 * remember edits that the rehydrated (older) source no longer has.
 */
export async function deleteRevision(
  revisionId: string,
): Promise<{ deletedId: string; sessionReset: boolean }> {
  const revision = await prisma.aiRevision.findUnique({
    where: { id: revisionId },
    select: {
      id: true,
      invitationId: true,
      buildId: true,
      bundleKey: true,
      createdAt: true,
    },
  });
  if (!revision) throw new Error("Revision not found.");
  const inv = await prisma.invitation.findUnique({
    where: { id: revision.invitationId },
    select: { activeRevisionId: true },
  });
  if (inv?.activeRevisionId === revision.id) {
    throw new Error(
      "The active version cannot be removed; activate another one first.",
    );
  }
  const newer = await prisma.aiRevision.count({
    where: { buildId: revision.buildId, createdAt: { gt: revision.createdAt } },
  });
  const sessionReset = newer === 0;

  if (revision.bundleKey) {
    // Best effort: a dangling object costs cents; a failed delete must not
    // leave the row behind.
    await deleteObject(revision.bundleKey).catch(() => undefined);
  }
  await prisma.$transaction([
    prisma.aiRevision.delete({ where: { id: revision.id } }),
    ...(sessionReset
      ? [
          prisma.aiBuild.update({
            where: { id: revision.buildId },
            data: { agentSessionId: null, lastContextTokens: null },
          }),
        ]
      : []),
  ]);
  return { deletedId: revision.id, sessionReset };
}

/**
 * Wipe every AI artifact for an invitation so the builder starts from scratch:
 * all builds — which cascade to their revisions, messages and attachments at
 * the DB level — plus their S3 objects (published bundles and uploaded
 * attachments). The invitation's settings and `renderMode: "ai"` are left
 * untouched, so it lands in the exact empty state of a freshly-created AI
 * invitation. Idempotent: safe to call when nothing has been generated yet.
 */
export async function resetInvitationAi(invitationId: string): Promise<{
  builds: number;
  revisions: number;
  deletedObjects: number;
}> {
  const builds = await prisma.aiBuild.findMany({
    where: { invitationId },
    select: {
      id: true,
      revisions: { select: { bundleKey: true } },
      attachments: { select: { objectKey: true } },
    },
  });

  const keys: string[] = [];
  let revisions = 0;
  for (const b of builds) {
    revisions += b.revisions.length;
    for (const r of b.revisions) if (r.bundleKey) keys.push(r.bundleKey);
    for (const a of b.attachments) keys.push(a.objectKey);
  }

  // Best effort, one at a time: a dangling object costs cents, and a failed
  // delete must never leave the database half-wiped.
  let deletedObjects = 0;
  for (const key of keys) {
    await deleteObject(key)
      .then(() => {
        deletedObjects += 1;
      })
      .catch(() => undefined);
  }

  // Clear the active-revision FK first — otherwise deleting the revision it
  // points at would violate the constraint — then delete the builds; the DB
  // cascades to revisions, messages and attachments.
  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitationId },
      data: { activeRevisionId: null },
    }),
    prisma.aiBuild.deleteMany({ where: { invitationId } }),
  ]);

  return { builds: builds.length, revisions, deletedObjects };
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

/**
 * A font the admin uploaded in the builder chat. It points at a global
 * `CustomFontFamily` (fonts are reusable, not owned by an invitation); the
 * denormalised `cssFamily`/`category` are what the agent brief and the runtime
 * `<Font>` need, so a deleted family just fails to load like any custom font.
 * Client components may import this type, but must do so with `import type`.
 */
export type FontAssetRecord = {
  id: string;
  customFontFamilyId: string;
  family: string;
  cssFamily: string;
  category: string;
};

const FONT_ASSET_SELECT = {
  id: true,
  customFontFamilyId: true,
  family: true,
  cssFamily: true,
  category: true,
} as const;

/** Link an already-created custom font to an invitation's build. */
export async function recordFontAsset(args: {
  buildId: string;
  invitationId: string;
  messageId?: string | null;
  customFontFamilyId: string;
  family: string;
  cssFamily: string;
  category: string;
}): Promise<FontAssetRecord> {
  return prisma.aiFontAsset.create({
    data: {
      buildId: args.buildId,
      invitationId: args.invitationId,
      messageId: args.messageId ?? null,
      customFontFamilyId: args.customFontFamilyId,
      family: args.family,
      cssFamily: args.cssFamily,
      category: args.category,
    },
    select: FONT_ASSET_SELECT,
  });
}

/** Every uploaded font for an invitation, oldest first. */
export async function listFontAssetsForInvitation(
  invitationId: string,
): Promise<FontAssetRecord[]> {
  return prisma.aiFontAsset.findMany({
    where: { invitationId },
    orderBy: { createdAt: "asc" },
    select: FONT_ASSET_SELECT,
  });
}

/** Uploaded fonts not yet sent with a message — what the composer tray shows. */
export async function listPendingFontAssets(
  invitationId: string,
): Promise<FontAssetRecord[]> {
  return prisma.aiFontAsset.findMany({
    where: { invitationId, messageId: null },
    orderBy: { createdAt: "asc" },
    select: FONT_ASSET_SELECT,
  });
}

/** Attach every not-yet-sent uploaded font to the message being sent. */
export async function linkPendingFontAssets(
  buildId: string,
  messageId: string,
): Promise<void> {
  await prisma.aiFontAsset.updateMany({
    where: { buildId, messageId: null },
    data: { messageId },
  });
}

/** Remove a font link from the composer tray (keeps the global font). */
export async function deleteFontAsset(id: string): Promise<void> {
  await prisma.aiFontAsset.delete({ where: { id } });
}

/** A revision resolved for preview: its invitation + whether it is published. */
/** Total USD spent across an invitation's build turns (from AiMessage.costUsd). */
export async function sumCostForInvitation(
  invitationId: string,
): Promise<number> {
  const rows = await prisma.aiMessage.findMany({
    where: { build: { invitationId }, costUsd: { not: null } },
    select: { costUsd: true },
  });
  return rows.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
}

export async function getRevisionForPreview(revisionId: string): Promise<{
  id: string;
  invitationId: string;
  bundleKey: string | null;
  bundleCode: string | null;
} | null> {
  return prisma.aiRevision.findUnique({
    where: { id: revisionId },
    select: {
      id: true,
      invitationId: true,
      bundleKey: true,
      bundleCode: true,
    },
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
