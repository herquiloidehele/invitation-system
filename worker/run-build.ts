import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { getObjectBuffer } from "@/lib/s3";
import { getInvitation } from "@/lib/invitations";
import { provisionWorkspace } from "./provision";
import { runBuildAgent } from "./agent";
import { bundleRegistersComponent } from "./lib/verify-bundle";
import { buildInvitationBrief } from "./lib/invitation-brief";
import { toBuildEvent, type BuildEvent } from "./lib/build-events";
import {
  proposeDirections,
  directionToPrompt,
  type Direction,
} from "./lib/directions";
import { buildAttachmentBrief } from "./lib/attachment-brief";
import {
  getOrCreateBuild,
  latestRevisionSource,
  createDraftRevision,
  appendMessage,
  listAttachmentsForInvitation,
  revisionCount,
  saveSessionId,
} from "./persistence";

/** The directions gate is deliberately cheap — bound what it looks at. */
const MAX_GATE_IMAGES = 4;
const MAX_GATE_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * The full build-and-publish flow, emitting typed events. Reused by the human
 * CLI and the NDJSON entry (which the admin SSE route spawns).
 */
export async function runInvitationBuild(args: {
  slug: string;
  prompt: string;
  /** Chosen direction — when set, the gate is skipped and this is built. */
  direction?: Direction | null;
  /** Ask for a fresh set of directions, optionally with a note. */
  refineDirections?: string | null;
  onEvent: (event: BuildEvent) => void;
}): Promise<{ ok: boolean }> {
  const { slug, prompt, direction, refineDirections, onEvent } = args;

  const invitation = await getInvitation(slug);
  if (!invitation) {
    onEvent({ kind: "error", message: `No invitation with slug "${slug}".` });
    return { ok: false };
  }
  const invRow = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  const invitationId = invRow!.id;

  const build = await getOrCreateBuild(invitationId);
  await appendMessage({ buildId: build.id, role: "user", content: prompt });
  const brief = buildInvitationBrief(invitation);
  const attachments = await listAttachmentsForInvitation(invitationId);

  // The directions gate: before any code exists, propose distinct visual
  // directions and stop. Fires when the invitation has no revisions at all, or
  // whenever another round is explicitly requested.
  const existing = await revisionCount(invitationId);
  if (!direction && (existing === 0 || refineDirections)) {
    // Moodboards matter most here. PDFs are skipped — they would need document
    // blocks and would blow up the cost of a deliberately cheap gate.
    const candidates = attachments.filter((a) => a.kind === "image");
    const chosen = candidates.slice(-MAX_GATE_IMAGES);
    if (candidates.length > chosen.length) {
      onEvent({
        kind: "progress",
        text: `A usar as ${chosen.length} imagens mais recentes de ${candidates.length}.`,
      });
    }
    const images: Array<{ mediaType: string; base64: string }> = [];
    for (const a of chosen) {
      const buf = await getObjectBuffer(a.objectKey).catch(() => null);
      if (!buf || buf.byteLength > MAX_GATE_IMAGE_BYTES) continue;
      images.push({ mediaType: a.mimeType, base64: buf.toString("base64") });
    }

    const { directions } = await proposeDirections({
      brief,
      prompt,
      note: refineDirections,
      images,
    });
    if (directions.length === 0) {
      const message = "Could not propose directions. Try again.";
      await appendMessage({
        buildId: build.id,
        role: "assistant",
        content: message,
      });
      onEvent({ kind: "error", message });
      return { ok: false };
    }
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: "Pick a direction to build.",
      directions,
    });
    onEvent({ kind: "directions", directions });
    return { ok: true };
  }

  const priorSource = await latestRevisionSource(build.id);
  const attachmentBrief = buildAttachmentBrief(attachments);
  const fullPrompt = [
    brief,
    direction ? `\n${directionToPrompt(direction)}` : "",
    attachmentBrief ? `\n${attachmentBrief}` : "",
    `\n${prompt}`,
  ].join("\n");

  const repoRoot = process.cwd();
  const dts = await readFile(
    path.join(repoRoot, "worker", "templates", "platform.d.ts"),
    "utf8",
  );
  const workspace = path.join(repoRoot, ".ai-workspaces", `inv-${invitationId}`);
  await mkdir(workspace, { recursive: true });
  await provisionWorkspace(workspace, dts, priorSource, attachments);

  // Keep the agent's last prose turn + final cost so the thread survives reload.
  let lastAssistantText = "";
  let costUsd: number | null = null;

  const { sessionId } = await runBuildAgent({
    workspaceDir: workspace,
    prompt: fullPrompt,
    bundleId: slug,
    dts,
    resume: build.agentSessionId ?? undefined,
    onMessage: (m) => {
      const e = toBuildEvent(m);
      if (!e) return;
      if (e.kind === "progress") lastAssistantText = e.text;
      if (e.kind === "result") costUsd = e.costUsd;
      onEvent(e);
    },
  });
  if (sessionId) await saveSessionId(build.id, sessionId);

  // The agent asks rather than guessing what an attachment is for. Checked
  // before bundle verification: on a tweak the previous dist/bundle.js is still
  // on disk, so "no new bundle" cannot signal a question by itself.
  const sentinelPath = path.join(workspace, "NEEDS_INPUT.md");
  const question = await readFile(sentinelPath, "utf8").catch(() => "");
  if (question.trim()) {
    await rm(sentinelPath, { force: true });
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: question.trim(),
      costUsd,
    });
    onEvent({ kind: "question", text: question.trim() });
    return { ok: true };
  }

  const indexTsx = await readFile(
    path.join(workspace, "index.tsx"),
    "utf8",
  ).catch(() => "");
  const bundleCode = await readFile(
    path.join(workspace, "dist", "bundle.js"),
    "utf8",
  ).catch(() => "");
  if (!bundleCode || !bundleRegistersComponent(bundleCode, slug)) {
    const message = "Build did not produce a valid bundle.";
    // Record the failure too — otherwise the thread shows a user turn with no
    // reply on reload, which reads as "still running".
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: lastAssistantText
        ? `${message}\n\n${lastAssistantText}`
        : message,
      costUsd,
    });
    onEvent({ kind: "error", message });
    return { ok: false };
  }

  const { revisionId } = await createDraftRevision({
    buildId: build.id,
    invitationId,
    prompt,
    sourceFiles: { "index.tsx": indexTsx },
  });
  await appendMessage({
    buildId: build.id,
    role: "assistant",
    content: lastAssistantText || "Draft ready.",
    revisionId,
    costUsd,
  });
  onEvent({ kind: "draft", revisionId, slug });
  return { ok: true };
}
