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
import { classifyBuildError } from "@/lib/build-errors";
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
  linkPendingAttachments,
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
  const userMessageId = await appendMessage({
    buildId: build.id,
    role: "user",
    content: prompt,
  });
  // Sending is what turns pending uploads into part of the conversation.
  await linkPendingAttachments(build.id, userMessageId);
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

  // Captured from the raw message stream, not only from the return value: the
  // SDK throws on a turn/budget cap, and losing the session id would silently
  // break `resume` on the next turn.
  let sessionIdSeen: string | null = null;
  let agentError: string | null = null;

  try {
    const { sessionId } = await runBuildAgent({
      workspaceDir: workspace,
      prompt: fullPrompt,
      bundleId: slug,
      dts,
      resume: build.agentSessionId ?? undefined,
      onMessage: (m) => {
        const raw = m as { session_id?: string };
        if (typeof raw.session_id === "string") sessionIdSeen = raw.session_id;
        const e = toBuildEvent(m);
        if (!e) return;
        if (e.kind === "progress") lastAssistantText = e.text;
        if (e.kind === "result") costUsd = e.costUsd;
        onEvent(e);
      },
    });
    if (sessionId) sessionIdSeen = sessionId;
  } catch (err) {
    // Do NOT return here. The agent may already have written a valid bundle
    // before it ran out of turns; throwing that away wastes the whole spend.
    agentError = err instanceof Error ? err.message : String(err);
  }
  if (sessionIdSeen) await saveSessionId(build.id, sessionIdSeen);

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
  // A capped run leaves the PREVIOUS turn's bundle on disk. Publishing that as
  // a new revision would silently claim success while changing nothing, so a
  // salvage only counts when the source actually moved.
  const sourceUnchanged = (priorSource?.["index.tsx"] ?? null) === indexTsx;
  const salvageImpossible =
    !bundleCode ||
    !bundleRegistersComponent(bundleCode, slug) ||
    (agentError !== null && sourceUnchanged);

  if (salvageImpossible) {
    const info = agentError
      ? classifyBuildError(agentError)
      : { title: "Build did not produce a valid bundle.", hint: undefined, detail: undefined };
    // Record the failure too — otherwise the thread shows a user turn with no
    // reply on reload, which reads as "still running".
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: lastAssistantText
        ? `${info.title}\n\n${lastAssistantText}`
        : info.title,
      costUsd,
    });
    onEvent({
      kind: "error",
      message: info.title,
      hint: info.hint,
      detail: info.detail,
    });
    return { ok: false };
  }

  if (agentError) {
    // Work survived the cap — say so rather than pretending it went cleanly.
    onEvent({
      kind: "progress",
      text: "O agente parou antes de terminar, mas o que já tinha construído foi guardado como rascunho.",
    });
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
